const BigNumber = require('bn.js')
const { expectRevert } = require('@openzeppelin/test-helpers');

const MockERC20 = artifacts.require('MockERC20')
const WETH = artifacts.require('WETH9')
const UniswapV2Factory = artifacts.require('UniswapV2Factory')
const UniswapV2Pair = artifacts.require('UniswapV2Pair')
const SoneToken = artifacts.require('SoneToken')
const SoneSwapRouter = artifacts.require('SoneSwapRouter')
const SoneConvert = artifacts.require('SoneConvert')

const revertMsg = require("./constants/error-msg.js").revertMsg;

var BN = (s) => new BigNumber(s.toString(), 10)

const MINIMUM_LIQUIDITY = 1000

contract('SoneSwapRouter - Withdraw Liquidity', ([alice, bob, owner]) => {
  beforeEach(async () => {
    // Initialize contract instances
    this.weth = await WETH.new({ from: owner })
    this.factory = await UniswapV2Factory.new(owner, { from: owner })
    this.router = await SoneSwapRouter.new(this.factory.address, this.weth.address, { from: owner })
    this.soneToken = await SoneToken.new(1, 1000, { from: owner })
    this.soneConvert = await SoneConvert.new(this.soneToken.address, this.weth.address, this.factory.address, this.router.address, { from: owner })
    this.token0 = await MockERC20.new('TOKEN0', 'TOKEN0', '50000000', { from: owner })
    this.token1 = await MockERC20.new('TOKEN1', 'TOKEN1', '50000000', { from: owner })

    // Transfer tokens to alice address
    await this.token0.transfer(alice, 10000000, { from: owner })
    await this.token1.transfer(alice, 10000000, { from: owner })

    // Appove allowance to spend alice's tokens for the router
    await this.token0.approve(this.router.address, 1000000, { from: alice })
    await this.token1.approve(this.router.address, 1000000, { from: alice })
  })

  describe('# withdraw liquidity in a pool excluding ETH', async () => {
    beforeEach(async () => {
      // Get pool address of the pair token0-token1
      this.pair = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.token1.address)).logs[0].args.pair)
      
      await this.router.addLiquidity(
        this.token0.address, this.token1.address, 1000000, 1000000, 0, 0, alice, 11571287987,
        { from: alice }
      )
    })

    it('burn without fee', async () => {
      await this.pair.approve(this.router.address, 1000000 - MINIMUM_LIQUIDITY, { from: alice })

      assert.equal((await this.pair.balanceOf(alice)).valueOf(), 1000000 - MINIMUM_LIQUIDITY)

      await this.router.removeLiquidity(
        this.token0.address, this.token1.address, 1000000 - MINIMUM_LIQUIDITY, 0, 0, alice, 11571287987,
        { from: alice }
      )

      assert.equal((await this.pair.totalSupply()).valueOf(), MINIMUM_LIQUIDITY)
      assert.equal((await this.pair.balanceOf(alice)).valueOf(), 0)

      const reserves = await this.pair.getReserves()
      assert.equal(reserves[0].valueOf(), MINIMUM_LIQUIDITY)
      assert.equal(reserves[1].valueOf(), MINIMUM_LIQUIDITY)
    })

    it('burn with fee', async () => {
      await this.factory.setWithdrawFeeTo(bob, { from: owner })
      await this.pair.approve(this.router.address, 1000000 - MINIMUM_LIQUIDITY, { from: alice })

      assert.equal((await this.pair.balanceOf(alice)).valueOf(), 1000000 - MINIMUM_LIQUIDITY)

      await this.router.removeLiquidity(
        this.token0.address, this.token1.address, 1000000 - MINIMUM_LIQUIDITY, 0, 0, alice, 11571287987,
        { from: alice }
      )

      assert.equal((await this.pair.totalSupply()).valueOf(), MINIMUM_LIQUIDITY + 999)
      assert.equal((await this.pair.balanceOf(alice)).valueOf(), 0)
      assert.equal((await this.token0.balanceOf(alice)).valueOf(), 9998001)
      assert.equal((await this.token1.balanceOf(alice)).valueOf(), 9998001)
      assert.equal((await this.pair.balanceOf(bob)).valueOf(), 999)

      const reserves = await this.pair.getReserves()
      assert.equal(reserves[0].valueOf(), 1999)
      assert.equal(reserves[1].valueOf(), 1999)
    })

    it('revert: burn with token amount min over the token reserve', async () => {
      await this.pair.approve(this.router.address, 1000000 - MINIMUM_LIQUIDITY, { from: alice })

      await expectRevert(this.router.removeLiquidity(
        this.token0.address, this.token1.address, 1000000 - MINIMUM_LIQUIDITY, 1000000, 1000000, alice, 11571287987,
        { from: alice }
      ), revertMsg.INSUFFICIENT_A_AMOUNT)
    })

    it('revert: burn with liquidity amount over the pool\'s liquidity', async () => {
      await this.pair.approve(this.router.address, 1000000 - MINIMUM_LIQUIDITY, { from: alice })

      assert.equal((await this.pair.balanceOf(alice)).valueOf(), 1000000 - MINIMUM_LIQUIDITY)

      await expectRevert(this.router.removeLiquidity(
        this.token0.address, this.token1.address, 1000000, 1000000, 1000000, alice, 11571287987,
        { from: alice }
      ), revertMsg.SUBTRACTION_OVERFLOW)
    })

    it('revert: burn zero output amount', async () => {
      await this.token0.approve(this.router.address, 1000, { from: alice })
      await this.pair.approve(this.router.address, 1000000 - MINIMUM_LIQUIDITY, { from: alice })

      assert.equal((await this.pair.balanceOf(alice)).valueOf(), 1000000 - MINIMUM_LIQUIDITY)

      await this.router.swapExactTokensForTokens(
        1000, 0, [this.token0.address, this.token1.address], alice, 11571287987,
        { from: alice }
      )
      await expectRevert(this.router.removeLiquidity(
        this.token0.address, this.token1.address, 1, 0, 0, alice, 11571287987,
        { from: alice }
      ), revertMsg.INSUFFICIENT_LIQUIDITY_BURNED)
    })
  });

  describe('# withdraw liquidity in a pool including ETH', async () => {
    beforeEach(async () => {
      // Get pool address of the pair token0-WETH
      this.pair = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.weth.address)).logs[0].args.pair)
      
      await this.router.addLiquidityETH(
        this.token0.address, 1000000, 0, 0, alice, 11571287987,
        {
          from: alice,
          value: 1000000
        }
      )
    })

    it('burn without fee', async () => {
      await this.pair.approve(this.router.address, 1000000 - MINIMUM_LIQUIDITY, { from: alice })

      assert.equal((await this.pair.balanceOf(alice)).valueOf(), 1000000 - MINIMUM_LIQUIDITY)
      return

      await this.router.removeLiquidityETH(
        this.token0.address, 1000000 - MINIMUM_LIQUIDITY, 0, 0, alice, 11571287987,
        { from: alice }
      )

      assert.equal((await this.pair.totalSupply()).valueOf(), MINIMUM_LIQUIDITY)
      assert.equal((await this.pair.balanceOf(alice)).valueOf(), 0)

      const reserves = await this.pair.getReserves()
      assert.equal(reserves[0].valueOf(), MINIMUM_LIQUIDITY)
      assert.equal(reserves[1].valueOf(), MINIMUM_LIQUIDITY)
    })

    it('burn with fee', async () => {
      await this.factory.setWithdrawFeeTo(bob, { from: owner })
      await this.pair.approve(this.router.address, 1000000 - MINIMUM_LIQUIDITY, { from: alice })

      assert.equal((await this.pair.balanceOf(alice)).valueOf(), 1000000 - MINIMUM_LIQUIDITY)

      await this.router.removeLiquidityETH(
        this.token0.address, 1000000 - MINIMUM_LIQUIDITY, 0, 0, alice, 11571287987,
        { from: alice }
      )

      assert.equal((await this.pair.totalSupply()).valueOf(), MINIMUM_LIQUIDITY + 999)
      assert.equal((await this.pair.balanceOf(alice)).valueOf(), 0)
      assert.equal((await this.token0.balanceOf(alice)).valueOf(), 9998001)
      assert.equal((await this.pair.balanceOf(bob)).valueOf(), 999)
      
      const reserves = await this.pair.getReserves()
      assert.equal(reserves[0].valueOf(), 1999)
      assert.equal(reserves[1].valueOf(), 1999)
    })
  });

  describe.skip('# withdraw liquidity with sone covert', async () => {
    beforeEach(async () => {
      // Transfer tokens to alice address
      await this.token0.transfer(bob, 10000000, { from: owner })
      await this.token1.transfer(bob, 10000000, { from: owner })

      // Appove allowance to spend bob's tokens for the router
      await this.token0.approve(this.router.address, 1000000, { from: bob })
      await this.token1.approve(this.router.address, 1000000, { from: bob })

      // Config addresses
      await this.factory.setSoneConvert(this.soneConvert.address, { from: owner })
      await this.factory.setFeeTo(owner, { from: owner })

      // Alice add liquidity
      await this.router.addLiquidity(
        this.token0.address, this.token1.address, 1000000, 1000000, 0, 0, alice, 11571287987,
        { from: alice }
      )
      // Bob add liquidity
      await this.token0.approve(this.router.address, 1000000, { from: bob })
      await this.token1.approve(this.router.address, 1000000, { from: bob })
      await this.router.addLiquidity(
        this.token0.address, this.token1.address, 1000000, 1000000, 0, 0, bob, 11571287987,
        { from: bob }
      )
    })

    it('return sone when exist 1 token can swap to SONE', async () => {
      // Create pool token0-SONE
      this.pairToken0SONE = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.soneToken.address)).logs[0].args.pair)

      this.soneToken.mint(alice, 10000000, { from: owner })
      await this.soneToken.approve(this.router.address, 2000000, { from: alice })
      await this.token0.approve(this.router.address, 2000000, { from: alice })

      await this.router.addLiquidity(
        this.token0.address, this.soneToken.address, 1000000, 1000000, 0, 0, alice, 11571287987,
        { from: alice }
      )

      // Swap 
      for (let index = 1; index < 30; index++) {
        await this.token0.approve(this.router.address, 1000, { from: alice })
        await this.router.swapExactTokensForTokens(
          1000, 0, [this.token0.address, this.token1.address], alice, 11571287987, { from: alice }
        )
      }

      // Remove liquidity
      await this.pair.approve(this.router.address, 1000000, { from: bob })
      await this.router.removeLiquidity(
        this.token0.address, this.token1.address, 1000000, 0, 0, bob, 11571287987,
        { from: bob }
      )

      assert.equal((await this.token0.balanceOf(bob)).valueOf(), 10014491) //  9000000 (balance) + 1014491 (remove liquid)
      assert.equal((await this.token1.balanceOf(bob)).valueOf(), 9985750) // 9000000 (balance) + 985750 (remove liquid)

      assert.equal((await this.soneToken.balanceOf(bob)).valueOf(), 5) // 3 (covert from token0-sone) + 2 (covert from token1-token0-sone)
    })

    it('return 2 tokens from convert', async () => {
      // Swap 
      for (let index = 1; index < 30; index++) {
        await this.token0.approve(this.router.address, 1000, { from: alice })
        await this.router.swapExactTokensForTokens(
          1000, 0, [this.token0.address, this.token1.address], alice, 11571287987,
          { from: alice }
        )
      }

      // Remove liquidity
      await this.pair.approve(this.router.address, 1000000, { from: bob })
      await this.router.removeLiquidity(
        this.token0.address, this.token1.address, 1000000, 0, 0, bob, 11571287987,
        { from: bob }
      )

      assert.equal((await this.token0.balanceOf(bob)).valueOf(), 10014495) //  9000000 (balance) + 1014491 (remove liquid) + 4 (from convert)
      assert.equal((await this.token1.balanceOf(bob)).valueOf(), 9985753) // 9000000 (balance) + 985750 (remove liquid) + 3 (from convert)
    })
  })
})