const UniswapV2Factory = artifacts.require('UniswapV2Factory')
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

contract('swap', ([alice, bob]) => {
  beforeEach(async () => {
    this.factory = await UniswapV2Factory.new(alice, { from: alice })
    this.token0 = await MockERC20.new('TOKEN0', 'TOKEN0', '10000000', { from: alice })
    this.token1 = await MockERC20.new('TOKEN1', 'TOKEN1', '10000000', { from: alice })
    this.pair = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.token1.address)).logs[0].args.pair)

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
  
      await this.token0.transfer(this.pair.address, '1000', { from: bob })
      await this.pair.swap(0, amountOut, bob, '0x', { from: bob })
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
  
      await this.token0.transfer(this.pair.address, '1005', { from: bob })
      await this.pair.swap(0, 1000, bob, '0x', { from: bob })
      assert.equal((await this.token0.balanceOf(bob)).valueOf(), BN(1000000).sub(amountIn).toString())
      assert.equal((await this.token1.balanceOf(bob)).valueOf(), 1000)
      
      const reserves = await this.pair.getReserves()
      assert.equal(reserves[0].valueOf(), (BN(1000000).add(amountIn)).toString())
      assert.equal(reserves[1].valueOf(), 999000)
    })
  })
})