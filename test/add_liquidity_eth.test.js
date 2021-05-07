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

contract('add liquidity eth', ([alice, bob, owner]) => {
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
      const balanceBeforeAdd = await web3.eth.getBalance(alice);
      const txAddLiquid = await this.router.addLiquidityETH(
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
      const tx = await web3.eth.getTransaction(txAddLiquid.tx);
      const gasPrice = tx.gasPrice;
      const fee = txAddLiquid.receipt.gasUsed * gasPrice;
      const balanceAfterAdd = await web3.eth.getBalance(alice);

      const value = BN(balanceBeforeAdd).sub(BN(balanceAfterAdd)).sub(BN(fee));
      assert.equal(value.valueOf(), 1000000)

      assert.equal((await this.pair.totalSupply()).valueOf(), 1000000)
      assert.equal((await this.pair.balanceOf(alice)).valueOf(), 1000000 - MINIMUM_LIQUIDITY)
      const reserves = await this.pair.getReserves()
      assert.equal(reserves[0].valueOf(), 1000000)
      assert.equal(reserves[1].valueOf(), 1000000)
    })
  });
})