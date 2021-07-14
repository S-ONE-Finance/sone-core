import BN from 'bn.js'
import {
  MockERC20Instance,
  SoneSwapRouterInstance,
  UniswapV2FactoryInstance,
  UniswapV2PairInstance,
  WETH9Instance,
} from '../types/truffle-contracts'

const MockERC20 = artifacts.require('MockERC20')
const WETH = artifacts.require('WETH9')
const UniswapV2Factory = artifacts.require('UniswapV2Factory')
const UniswapV2Pair = artifacts.require('UniswapV2Pair')
const SoneSwapRouter = artifacts.require('SoneSwapRouter')

const _BN = (str: string | number) => new BN(str)

function getAmountOut(amountIn: BN, reserveIn: BN, reserveOut: BN, swapFee: BN) {
  var amountInWithFee = amountIn.mul(_BN(1000).sub(swapFee))
  var numerator = amountInWithFee.mul(reserveOut)
  var denominator = reserveIn.mul(_BN(1000)).add(amountInWithFee)
  return numerator.div(denominator)
}
function getAmountIn(amountOut: BN, reserveIn: BN, reserveOut: BN, swapFee: BN) {
  var numerator = reserveIn.mul(amountOut).mul(_BN(1000))
  var denominator = reserveOut.sub(amountOut).mul(_BN(1000).sub(swapFee))
  return numerator.div(denominator).add(_BN(1))
}

contract('swap', ([owner, alice, bob]) => {
  let _weth: WETH9Instance
  let _factory: UniswapV2FactoryInstance
  let _router: SoneSwapRouterInstance
  let _token0: MockERC20Instance
  let _token1: MockERC20Instance
  let _pair: UniswapV2PairInstance
  let _swapFee: BN

  beforeEach(async () => {
    // Initialize contract instances
    _factory = await UniswapV2Factory.new(alice, { from: alice })
    _token0 = await MockERC20.new('TOKEN0', 'TOKEN0', '10000000', {
      from: alice,
    })
    _token1 = await MockERC20.new('TOKEN1', 'TOKEN1', '10000000', {
      from: alice,
    })
    _pair = await UniswapV2Pair.at((await _factory.createPair(_token0.address, _token1.address)).logs[0].args.pair)
    _weth = await WETH.new({ from: owner })
    _router = await SoneSwapRouter.new(_factory.address, _weth.address, {
      from: owner,
    })

    // add liquidity
    _swapFee = await _factory.swapFee()
    // Transfer tokens to alice address
    await _token0.transfer(_pair.address, '1000000', { from: alice })
    await _token1.transfer(_pair.address, '1000000', { from: alice })
    await _pair.mint(alice, { from: alice })
  })

  describe('#swap 2 token', async () => {
    it('swap exact token1', async () => {
      // init token0 for bob
      await _token0.mint(bob, 1000000)
      // check bob's token0 balance
      assert.equal((await _token0.balanceOf(bob)).valueOf(), 1000000, 'bob token0 balance equal to 1000000')

      const amountOut = getAmountOut(_BN(1000), _BN(1000000), _BN(1000000), _swapFee)
      // check amount out
      assert.equal(amountOut.toNumber(), 996, 'amountOut equal to 996') // 996.006981
      // approve for router to spend bob's token0
      await _token0.approve(_router.address, 1000, { from: bob })
      // swap
      await _router.swapExactTokensForTokens(1000, 0, [_token0.address, _token1.address], bob, 11571287987, { from: bob })
      // check bob balance of token0 and token1
      assert.equal((await _token0.balanceOf(bob)).valueOf(), 999000, "bob's token0 balance equal to 999000")
      assert.equal((await _token1.balanceOf(bob)).valueOf(), amountOut.toString(), "bob's token1 balance equal to amountOut")

      // check reserves
      const reserves = await _pair.getReserves()
      if (_token0.address < _token1.address) {
        assert.equal(reserves[0].valueOf(), 1001000, 'reserves[0] equal to 1001000')
        assert.equal(reserves[1].valueOf(), _BN(1000000).sub(amountOut).toString(), 'reserves[1] equal to 1000000 - amountOut')
      } else {
        assert.equal(reserves[1].valueOf(), 1001000, 'reserves[1] equal to 1001000')
        assert.equal(reserves[0].valueOf(), _BN(1000000).sub(amountOut).toString(), 'reserves[0] equal to 1000000 - amountOut')
      }
    })
    it('swap exact token2', async () => {
      // mint token0 for bob
      await _token0.mint(bob, 1000000)
      // check bob token0 balance
      assert.equal((await _token0.balanceOf(bob)).valueOf(), 1000000, 'bob token0 balance equal to 1000000')

      const amountIn = getAmountIn(_BN(1000), _BN(1000000), _BN(1000000), _swapFee)
      // check amount in
      assert.equal(amountIn.toNumber(), 1005, 'amountIn equal to 1005') // 1005.01304
      // Appove allowance to spend bob's tokens for the _router
      await _token0.approve(_router.address, 1000000, { from: bob })
      // swap token0 and token1
      await _router.swapTokensForExactTokens(1000, 1000000, [_token0.address, _token1.address], bob, 11571287987, { from: bob })
      assert.equal(
        (await _token0.balanceOf(bob)).valueOf(),
        _BN(1000000).sub(amountIn).toString(),
        'bob token0 balance equal to 1000000 - amountIn'
      )
      assert.equal((await _token1.balanceOf(bob)).valueOf(), 1000, 'bob token1 balance equal to 1000')

      // check reserves
      const reserves = await _pair.getReserves()
      if (_token0.address < _token1.address) {
        assert.equal(reserves[0].valueOf(), _BN(1000000).add(amountIn).toString(), 'reserves[0] equal to 1000000 + amountIn')
        assert.equal(reserves[1].valueOf(), 999000, 'reserves[1] equal to 999000')
      } else {
        assert.equal(reserves[1].valueOf(), _BN(1000000).add(amountIn).toString(), 'reserves[1] equal to 1000000 + amountIn')
        assert.equal(reserves[0].valueOf(), 999000, 'reserves[0] equal to 999000')
      }
    })
  })
})
