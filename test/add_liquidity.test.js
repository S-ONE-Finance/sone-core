const BigNumber = require('bn.js')

const MockERC20 = artifacts.require('MockERC20')
const WETH = artifacts.require('WETH9')
const UniswapV2Factory = artifacts.require('UniswapV2Factory')
const UniswapV2Pair = artifacts.require('UniswapV2Pair')
const SoneToken = artifacts.require('SoneToken')
const SoneSwapRouter = artifacts.require('SoneSwapRouter')
const SoneConvert = artifacts.require('SoneConvert')

var BN = (s) => new BigNumber(s.toString(), 10)

const MINIMUM_LIQUIDITY = 1000

contract('SoneSwapRouter - Add Liquidity', ([alice, bob, owner]) => {
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
    await this.token0.transfer(alice, 1000000, { from: owner })
    await this.token1.transfer(alice, 1000000, { from: owner })

    // Appove allowance to spend alice's tokens for the router
    await this.token0.approve(this.router.address, 1000000, { from: alice })
    await this.token1.approve(this.router.address, 1000000, { from: alice })
  })

  describe('# add liquidity with 2 tokens', async () => {
    it('to a pool excluding ETH', async () => {
      this.pair = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.token1.address)).logs[0].args.pair)

      await this.router.addLiquidity(
        this.token0.address, this.token1.address, 1000000, 1000000, 0, 0, alice, 11571287987,
        { from: alice }
      )

      assert.equal((await this.pair.totalSupply()).valueOf(), 1000000)
      assert.equal((await this.pair.balanceOf(alice)).valueOf(), 1000000 - MINIMUM_LIQUIDITY)

      const reserves = await this.pair.getReserves()
      assert.equal(reserves[0].valueOf(), 1000000)
      assert.equal(reserves[1].valueOf(), 1000000)
    })

    it('to a pool including ETH', async () => {
      this.pair = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.weth.address)).logs[0].args.pair)

      const balanceBeforeAdd = await web3.eth.getBalance(alice)

      const txAddLiquidity = await this.router.addLiquidityETH(
        this.token0.address, 1000000, 0, 0, alice, 11571287987,
        {
          from: alice,
          value: 1000000
        }
      )
      const tx = await web3.eth.getTransaction(txAddLiquidity.tx)
      const gasPrice = tx.gasPrice
      const fee = txAddLiquidity.receipt.gasUsed * gasPrice
      const balanceAfterAdd = await web3.eth.getBalance(alice)

      const value = BN(balanceBeforeAdd).sub(BN(balanceAfterAdd)).sub(BN(fee))
      assert.equal(value.valueOf(), 1000000)
      assert.equal((await this.pair.totalSupply()).valueOf(), 1000000)
      assert.equal((await this.pair.balanceOf(alice)).valueOf(), 1000000 - MINIMUM_LIQUIDITY)

      const reserves = await this.pair.getReserves()
      assert.equal(reserves[0].valueOf(), 1000000)
      assert.equal(reserves[1].valueOf(), 1000000)
    })
  });

  describe('# add liquidity with 1 token', async () => {
    beforeEach(async () => {
      // Appove allowance to spend bob's tokens for the router
      await this.token0.approve(this.router.address, 1000000, { from: bob })
      await this.token1.approve(this.router.address, 1000000, { from: bob })
    })
    
    it('to a pool excluding ETH', async () => {
      this.pair = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.token1.address)).logs[0].args.pair)
      
      await this.token0.transfer(bob, 10000000, { from: owner })
      await this.router.addLiquidity(
        this.token0.address, this.token1.address, 1000000, 1000000, 0, 0, alice, 11571287987,
        { from: alice }
      )
      await this.router.addLiquidityOneToken(
        2000, 0, 0, 0, [this.token0.address, this.token1.address], bob, 11571287987,
        { from: bob }
      )

      assert.equal((await this.token0.balanceOf(bob)).valueOf(), 10000000 - 1000 - 997)
      assert.equal((await this.token1.balanceOf(bob)).valueOf(), 0)
      assert.equal((await this.pair.totalSupply()).valueOf(), 1000996)
      assert.equal((await this.pair.balanceOf(bob)).valueOf(), 996)

      const reserves = await this.pair.getReserves()  // [token1, token0]
      if (this.token1.address < this.token0.address) {
        assert.equal(reserves[1].valueOf(), 1001997)  // balance0 = 1000000(add 1)+1000(swap)+997(add 2)
        assert.equal(reserves[0].valueOf(), 1000000)  // balance1 = 1000000(add 1)-996(swap)+996(add 2)
      } else {
        assert.equal(reserves[0].valueOf(), 1001997)  // balance0 = 1000000(add 1)+1000(swap)+997(add 2)
        assert.equal(reserves[1].valueOf(), 1000000)  // balance1 = 1000000(add 1)-996(swap)+996(add 2)
      }
    })

    it('to a pool including ETH', async () => {
      this.pair = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.weth.address)).logs[0].args.pair)
      
      const balanceBeforeAdd = await web3.eth.getBalance(bob);

      await this.router.addLiquidityETH(
        this.token0.address, 1000000, 0, 0, alice, 11571287987,
        {
          from: alice,
          value: 1000000
        }
      )
      const txAddLiquid = await this.router.addLiquidityOneTokenETHExactETH(
        0, 0, 0, [this.weth.address, this.token0.address], bob, 11571287987,
        {
          from: bob,
          value: 2000
        }
      )
      const tx = await web3.eth.getTransaction(txAddLiquid.tx);
      const gasPrice = tx.gasPrice;
      const fee = txAddLiquid.receipt.gasUsed * gasPrice;
      const balanceAfterAdd = await web3.eth.getBalance(bob);
      
      assert.equal((await this.token0.balanceOf(bob)).valueOf(), 0)

      const value = BN(balanceBeforeAdd).sub(BN(balanceAfterAdd)).sub(BN(fee));
      assert.equal(value.valueOf(), 1997) // 1000(swap) + 997 (add)
      assert.equal((await this.pair.totalSupply()).valueOf(), 1000996)
      assert.equal((await this.pair.balanceOf(bob)).valueOf(), 996)

      const reserves = await this.pair.getReserves() // [weth, token0]
      if (this.weth.address < this.token0.address) {
        assert.equal(reserves[0].valueOf(), 1001997)  // balanceWETH = 1000000(add 1)+1000(swap)+997(add 2)
        assert.equal(reserves[1].valueOf(), 1000000) // balance0 = 1000000(add 1)-996(swap)+996(add 2)
      } else {
        assert.equal(reserves[1].valueOf(), 1001997)  // balanceWETH = 1000000(add 1)+1000(swap)+997(add 2)
        assert.equal(reserves[0].valueOf(), 1000000) // balance0 = 1000000(add 1)-996(swap)+996(add 2)
      }
    })
  });
})