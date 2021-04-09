const UniswapV2Factory = artifacts.require('UniswapV2Factory')
const SoneSwapRouter = artifacts.require('SoneSwapRouter')
const WETH = artifacts.require('WETH9')
const UniswapV2Pair = artifacts.require('UniswapV2Pair')
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
function getAmountIn(amountOut, reserveIn, reserveOut, swapFee) {
  var numerator = reserveIn.mul(amountOut).mul(BN(1000))
  var denominator = reserveOut.sub(amountOut).mul(BN(1000).sub(swapFee))
  return numerator.div(denominator).add(BN(1))
}

contract('swap', ([alice, bob, owner]) => {
  beforeEach(async () => {
    this.factory = await UniswapV2Factory.new(alice, { from: alice })
    this.token0 = await MockERC20.new('TOKEN0', 'TOKEN0', '10000000', { from: alice })
    this.token1 = await MockERC20.new('TOKEN1', 'TOKEN1', '10000000', { from: alice })
    this.pair = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.token1.address)).logs[0].args.pair)
    this.weth = await WETH.new({ from: owner })
    this.router = await SoneSwapRouter.new(this.factory.address, this.weth.address, { from: owner })

    // add liquidity
    this.swapFee = await this.factory.swapFee()
    await this.token0.transfer(this.pair.address, '1000000', { from: alice })
    await this.token1.transfer(this.pair.address, '1000000', { from: alice })
    await this.pair.mint(alice, { from: alice })
  })

  describe('#swap 2 token', async () => {
    it('swap exact token1', async () => {
      await this.token0.mint(bob, 1000000)
      assert.equal((await this.token0.balanceOf(bob)).valueOf(), 1000000)
  
      const amountOut = getAmountOut(BN(1000), BN(1000000), BN(1000000), BN(this.swapFee))
      assert.equal(amountOut, 996) // 996.006981

      await this.token0.approve(this.router.address, 1000, { from: bob })
        await this.router.swapExactTokensForTokens(
          1000,
          0,
          [this.token0.address, this.token1.address],
          bob,
          11571287987,
          { from: bob }  
        )
      assert.equal((await this.token0.balanceOf(bob)).valueOf(), 999000)
      assert.equal((await this.token1.balanceOf(bob)).valueOf(), amountOut.toString())
      
      const reserves = await this.pair.getReserves()
      assert.equal(reserves[0].valueOf(), 1001000)
      assert.equal(reserves[1].valueOf(), (BN(1000000) - amountOut).toString())
    })
    it('swap exact token2', async () => {
      await this.token0.mint(bob, 1000000)
      assert.equal((await this.token0.balanceOf(bob)).valueOf(), 1000000)
  
      const amountIn = getAmountIn(BN(1000), BN(1000000), BN(1000000), BN(this.swapFee))
      assert.equal(amountIn, 1005) // 1005.01304
  
      await this.token0.approve(this.router.address, 1000000, { from: bob })
        await this.router.swapTokensForExactTokens(
          1000,
          1000000,
          [this.token0.address, this.token1.address],
          bob,
          11571287987,
          { from: bob }  
        )
      assert.equal((await this.token0.balanceOf(bob)).valueOf(), BN(1000000).sub(amountIn).toString())
      assert.equal((await this.token1.balanceOf(bob)).valueOf(), 1000)
      
      const reserves = await this.pair.getReserves()
      assert.equal(reserves[0].valueOf(), (BN(1000000).add(amountIn)).toString())
      assert.equal(reserves[1].valueOf(), 999000)
    })
  })
})