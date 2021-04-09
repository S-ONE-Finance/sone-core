const UniswapV2Factory = artifacts.require('UniswapV2Factory')
const UniswapV2Pair = artifacts.require('UniswapV2Pair')
const WETH = artifacts.require('WETH9')
const SoneSwapRouter = artifacts.require('SoneSwapRouter')
const SoneToken = artifacts.require('SoneToken')
const SoneConvert = artifacts.require('SoneConvert')
const MockERC20 = artifacts.require('MockERC20')
const BigNumber = require('bn.js')
var BN = (s) => new BigNumber(s.toString(), 10)

const MINIMUM_LIQUIDITY = 1000

function getAmountOut(amountIn, reserveIn, reserveOut, swapFee) {
  var amountInWithFee = amountIn.mul(BN(1000).sub(swapFee))
  var numerator = amountInWithFee.mul(reserveOut)
  var denominator = reserveIn.mul(BN(1000)).add(amountInWithFee)
  return numerator.div(denominator)
}

contract('liquidity eth', ([alice, bob, owner]) => {
  beforeEach(async () => {
    this.factory = await UniswapV2Factory.new(owner, { from: owner })
    this.token0 = await MockERC20.new('TOKEN0', 'TOKEN0', '10000000', { from: alice })
    this.weth = await WETH.new({ from: owner })
    this.router = await SoneSwapRouter.new(this.factory.address, this.weth.address, { from: owner })
    this.pair = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.weth.address)).logs[0].args.pair)
    this.soneToken = await SoneToken.new(1, 1000, {from: owner})
    this.soneConvert = await SoneConvert.new(this.soneToken.address, this.weth.address, this.factory.address, this.router.address, { from: owner })
    this.swapFee = await this.factory.swapFee()
  })

  describe('#add liquidity', async () => {
    it('mint', async () => {
      await this.token0.approve(this.router.address, 1000000,  {from: alice })
      await this.router.addLiquidityETH(
        this.token0.address,
        1000000,
        0,
        0,
        alice,
        11571287987,
        {
          from: alice,
          value: 1000000
        }
      )
      assert.equal((await this.pair.totalSupply()).valueOf(), 1000000)
      assert.equal((await this.pair.balanceOf(alice)).valueOf(), 1000000 - MINIMUM_LIQUIDITY)
      const reserves = await this.pair.getReserves()
      assert.equal(reserves[0].valueOf(), 1000000)
      assert.equal(reserves[1].valueOf(), 1000000)
    })
  });
  describe('#withdraw liquidity', async () => {
    it('burn: without fee', async () => {
      await this.token0.approve(this.router.address, 1000000,  {from: alice })
      await this.router.addLiquidityETH(
        this.token0.address,
        1000000,
        0,
        0,
        alice,
        11571287987,
        {
          from: alice,
          value: 1000000
        }
      )

      await this.pair.approve(this.router.address, 1000000 - MINIMUM_LIQUIDITY, { from: alice })
      await this.router.removeLiquidityETH(
        this.token0.address,
        1000000 - MINIMUM_LIQUIDITY,
        0,
        0,
        alice,
        11571287987,
        { from: alice}
      )
  
      assert.equal((await this.pair.totalSupply()).valueOf(), MINIMUM_LIQUIDITY)
      assert.equal((await this.pair.balanceOf(alice)).valueOf(), 0)
      const reserves = await this.pair.getReserves()
      assert.equal(reserves[0].valueOf(), MINIMUM_LIQUIDITY)
      assert.equal(reserves[1].valueOf(), MINIMUM_LIQUIDITY)
    })
  
    it('burn: with fee', async () => {
      await this.factory.setWithdrawFeeTo(bob, { from: owner })
  
      await this.token0.approve(this.router.address, 1000000,  {from: alice })
      await this.router.addLiquidityETH(
        this.token0.address,
        1000000,
        0,
        0,
        alice,
        11571287987,
        {
          from: alice,
          value: 1000000
        }
      )

      await this.pair.approve(this.router.address, 1000000 - MINIMUM_LIQUIDITY, { from: alice })
      await this.router.removeLiquidityETH(
        this.token0.address,
        1000000 - MINIMUM_LIQUIDITY,
        0,
        0,
        alice,
        11571287987,
        { from: alice}
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
  describe('#withdraw liquidity with sone covert', async () => {
    beforeEach(async () => {
      await this.factory.setSoneConvert(this.soneConvert.address, { from: owner })
      await this.factory.setFeeTo(owner, { from: owner })
      await this.token0.mint(bob, 10000000)
      // alice add liquidity
      await this.token0.approve(this.router.address, 1000000,  {from: alice })
      await this.router.addLiquidityETH(
        this.token0.address,
        1000000,
        0,
        0,
        alice,
        11571287987,
        {
          from: alice,
          value: 1000000
        }
      )
      // bob add liquidity
      await this.token0.approve(this.router.address, 1000000,  {from: bob })
      await this.router.addLiquidityETH(
        this.token0.address,
        1000000,
        0,
        0,
        bob,
        11571287987,
        {
          from: bob,
          value: 1000000
        }
      )
    })

    it('return sone when exist 1 token can swap to SONE', async () => {
      // create pool token0-SONE
      this.pairToken0SONE = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.soneToken.address)).logs[0].args.pair)
      this.soneToken.mint( alice, 10000000, {from: owner})
      await this.token0.approve(this.router.address, 1000000, { from: alice })
      await this.soneToken.approve(this.router.address, 1000000, { from: alice })
      await this.router.addLiquidity(
        this.token0.address,
        this.soneToken.address,
        1000000,
        1000000,
        0,
        0,
        alice,
        11571287987,
        { from: alice }
      )

      // swap 
      for (let index = 1; index < 30; index++) {
        await this.token0.approve(this.router.address, 1000, { from: alice })
        await this.router.swapExactTokensForETH(
          1000,
          0,
          [this.token0.address, this.weth.address],
          alice,
          11571287987,
          { from: alice }  
        )
      }
      // remove liquidity
      await this.pair.approve(this.router.address, 1000000, { from: bob })
      await this.router.removeLiquidityETH(
        this.token0.address,
        1000000,
        0,
        0,
        bob,
        11571287987,
        { from: bob}
      )
      assert.equal((await this.token0.balanceOf(bob)).valueOf(), 10014491) //  9000000 (balance) + 1014491 (remove liquid)
      assert.equal((await this.soneToken.balanceOf(bob)).valueOf(), 3) // 3 (covert from token0-sone)
      assert.equal((await this.weth.balanceOf(bob)).valueOf(), 3) // 3
    })
    
    it('return 2 token from convert', async () => {
      // swap 
      for (let index = 1; index < 30; index++) {
        await this.token0.approve(this.router.address, 1000, { from: alice })
        await this.router.swapExactTokensForETH(
          1000,
          0,
          [this.token0.address, this.weth.address],
          alice,
          11571287987,
          { from: alice }  
        )
      }
      // remove liquidity
      await this.pair.approve(this.router.address, 1000000, { from: bob })
      await this.router.removeLiquidityETH(
        this.token0.address,
        1000000,
        0,
        0,
        bob,
        11571287987,
        { from: bob}
      )
      assert.equal((await this.token0.balanceOf(bob)).valueOf(), 10014491) //  9000000 (balance) + 1014491 (remove liquid)
      assert.equal((await this.weth.balanceOf(bob)).valueOf(), 6) // 6 (from convert)
    })
  })
})