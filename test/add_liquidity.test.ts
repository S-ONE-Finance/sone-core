import BN from "bn.js"
import { CurrencyAmount, Token, TokenAmount, Pair, ChainId, BigintIsh, JSBI } from "@s-one-finance/sdk-core"
import { MockERC20Instance, SoneSwapRouterInstance, UniswapV2FactoryInstance, UniswapV2PairInstance, WETH9Instance } from "../types/truffle-contracts"

const MockERC20 = artifacts.require('MockERC20')
const WETH = artifacts.require('WETH9')
const UniswapV2Factory = artifacts.require('UniswapV2Factory')
const UniswapV2Pair = artifacts.require('UniswapV2Pair')
const SoneSwapRouter = artifacts.require('SoneSwapRouter')

const MINIMUM_LIQUIDITY = 1000
const _BN = (str: string | number) => new BN(str)

function decimalize(amount: number, decimals: number): bigint {
  return BigInt(amount) * BigInt(10) ** BigInt(decimals)
}

contract('SoneSwapRouter - Add Liquidity', ([alice, bob, owner]) => {
  let _weth: WETH9Instance
  let _factory: UniswapV2FactoryInstance
  let _router: SoneSwapRouterInstance
  let _token0: MockERC20Instance
  let _token1: MockERC20Instance
  let _pair: UniswapV2PairInstance


  beforeEach(async () => {
    // Initialize contract instances
    _weth = await WETH.new({ from: owner })
    _factory = await UniswapV2Factory.new(owner, { from: owner })
    _router = await SoneSwapRouter.new(_factory.address, _weth.address, { from: owner })
    _token0 = await MockERC20.new('TOKEN0', 'TOKEN0', '50000000', { from: owner })
    _token1 = await MockERC20.new('TOKEN1', 'TOKEN1', '50000000', { from: owner })

    // Transfer tokens to alice address
    await _token0.transfer(alice, 10000000, { from: owner })
    await _token1.transfer(alice, 10000000, { from: owner })

    // Appove allowance to spend alice's tokens for the _router
    await _token0.approve(_router.address, 7000000, { from: alice })
    await _token1.approve(_router.address, 7000000, { from: alice })
  })

  describe('# add liquidity with 2 tokens', async () => {
    it('to a new pool excluding ETH', async () => {
      _pair = await UniswapV2Pair.at((await _factory.createPair(_token0.address, _token1.address)).logs[0].args.pair)

      let amountADesired: BN = _BN(1000000)
      let amountBDesired: BN = _BN(1000000)
      let amountAMin: BN = _BN(1000000)
      let amountBMin: BN = _BN(1000000)

      await _router.addLiquidity(
        _token0.address, _token1.address, amountADesired, amountBDesired, amountAMin, amountBMin, alice, 11571287987,
        { from: alice }
      )

      assert.equal((await _pair.totalSupply()).toNumber(), 1000000)
      assert.equal((await _pair.balanceOf(alice)).toNumber(), 1000000 - MINIMUM_LIQUIDITY)

      const reserves = await _pair.getReserves()
      assert.equal(reserves[0].toNumber(), 1000000)
      assert.equal(reserves[1].toNumber(), 1000000)
    })

    it.skip('to a existed pool excluding ETH', async () => {
      _pair = await UniswapV2Pair.at((await _factory.createPair(_token0.address, _token1.address)).logs[0].args.pair)

      let amountADesired: BN = _BN(1500000)
      let amountBDesired: BN = _BN(1000000)
      let amountAMin: BN = _BN(1500000)
      let amountBMin: BN = _BN(1000000)

      await _router.addLiquidity(
        _token0.address, _token1.address, amountADesired, amountBDesired, amountAMin, amountBMin, alice, 11571287987,
        { from: alice }
      )
      const reservesBefore = await _pair.getReserves()
      console.log('reserve[0] :>> ', reservesBefore[0].toNumber());
      console.log('reserve[1] :>> ', reservesBefore[1].toNumber());

      enum Tokens {
        CURRENCY_A = 'CURRENCY_A',
        CURRENCY_B = 'CURRENCY_B'
      }
      const tokens: Token[] = [
        new Token(ChainId.MAINNET, _token0.address, (await _token0.decimals()).toNumber(), await _token0.symbol(), await _token0.name()),
        new Token(ChainId.MAINNET, _token1.address, (await _token1.decimals()).toNumber(), await _token1.symbol(), await _token1.name()),
      ]
      const pair = new Pair(new TokenAmount(tokens[0], reservesBefore[0].toString()), new TokenAmount(tokens[1], reservesBefore[1].toString()))
      console.log('pair info reserve[0] :>> ', pair.reserve0);
      console.log('pair info reserve[1]:>> ', pair.reserve1);
      const output = pair.getOutputAmount(new TokenAmount(tokens[0], BigInt(1000000)))
      console.log('output :>> ', output[1].reserve0.toSignificant(3));

      const amounts: { [token in Tokens]: CurrencyAmount } = {
        [Tokens.CURRENCY_A]: new TokenAmount(tokens[0], BigInt(1000000)),
        [Tokens.CURRENCY_B]: output[0]
      }

      const allowedSlippage = 100 // 1%
      const amountsMin = {
        [Tokens.CURRENCY_A]: calculateSlippageAmount(amounts.CURRENCY_A, allowedSlippage)[0],
        [Tokens.CURRENCY_B]: calculateSlippageAmount(amounts.CURRENCY_B, allowedSlippage)[0]
      }

      amountADesired = _BN(amounts.CURRENCY_A.numerator.toString())
      amountBDesired = _BN(amounts.CURRENCY_B.numerator.toString())
      amountAMin = _BN(amountsMin.CURRENCY_A.toString())
      amountBMin = _BN(amountsMin.CURRENCY_B.toString())

      console.log('amountADesired :>> ', amountADesired.toNumber());
      console.log('amountBDesired :>> ', amountBDesired.toNumber());
      console.log('amountAMin :>> ', amountAMin.toNumber());
      console.log('amountBMin :>> ', amountBMin.toNumber());

      await _router.addLiquidity(
        _token0.address, _token1.address, amountADesired, amountBDesired, amountAMin, amountBMin, alice, 11571287987,
        { from: alice }
      )

      console.log('totalSupply :>> ', (await _pair.totalSupply()).toNumber());
      console.log('balanceOf :>> ', (await _pair.balanceOf(alice)).toNumber());

      const reserves = await _pair.getReserves()
      console.log('reserve[0] :>> ', reserves[0].toNumber());
      console.log('reserve[1] :>> ', reserves[1].toNumber());

      // assert.equal((await _pair.totalSupply()).toNumber(), 1000000)
      // assert.equal((await _pair.balanceOf(alice)).toNumber(), 1000000 - MINIMUM_LIQUIDITY)

      // const reserves = await _pair.getReserves()
      // assert.equal(reserves[0].toNumber(), 1000000)
      // assert.equal(reserves[1].toNumber(), 1000000)
    })

    it('to a new pool including ETH', async () => {
      _pair = await UniswapV2Pair.at((await _factory.createPair(_token0.address, _weth.address)).logs[0].args.pair)

      const balanceBeforeAdd = await web3.eth.getBalance(alice)

      const txAddLiquidityity = await _router.addLiquidityETH(
        _token0.address, 1000000, 0, 0, alice, 11571287987,
        {
          from: alice,
          value: "1000000"
        }
      )
      const tx = await web3.eth.getTransaction(txAddLiquidityity.tx)
      const fee = txAddLiquidityity.receipt.gasUsed * Number(tx.gasPrice)
      const balanceAfterAdd = await web3.eth.getBalance(alice)

      const value = _BN(balanceBeforeAdd).sub(_BN(balanceAfterAdd)).sub(_BN(fee))
      assert.equal(value, 1000000)
      assert.equal((await _pair.totalSupply()).toNumber(), 1000000)
      assert.equal((await _pair.balanceOf(alice)).toNumber(), 1000000 - MINIMUM_LIQUIDITY)

      const reserves = await _pair.getReserves()
      assert.equal(reserves[0].toNumber(), 1000000)
      assert.equal(reserves[1].toNumber(), 1000000)
    })
  })

  describe('# add liquidity with 1 token', async () => {
    beforeEach(async () => {
      // Appove allowance to spend bob's tokens for the _router
      await _token0.approve(_router.address, 1000000, { from: bob })
      await _token1.approve(_router.address, 1000000, { from: bob })
    })

    it('to a new pool excluding ETH', async () => {
      _pair = await UniswapV2Pair.at((await _factory.createPair(_token0.address, _token1.address)).logs[0].args.pair)

      await _token0.transfer(bob, 10000000, { from: owner })
      await _router.addLiquidity(
        _token0.address, _token1.address, 1000000, 1000000, 0, 0, alice, 11571287987,
        { from: alice }
      )
      await _router.addLiquidityOneToken(
        2000, 0, 0, 0, [_token0.address, _token1.address], bob, 11571287987,
        { from: bob }
      )

      assert.equal((await _token0.balanceOf(bob)).toNumber(), 10000000 - 1000 - 997)
      assert.equal((await _token1.balanceOf(bob)).toNumber(), 0)
      assert.equal((await _pair.totalSupply()).toNumber(), 1000996)
      assert.equal((await _pair.balanceOf(bob)).toNumber(), 996)

      const reserves = await _pair.getReserves()  // [_token1, _token0]
      if (_token1.address < _token0.address) {
        assert.equal(reserves[1].toNumber(), 1001997)  // balance0 = 1000000(add 1)+1000(swap)+997(add 2)
        assert.equal(reserves[0].toNumber(), 1000000)  // balance1 = 1000000(add 1)-996(swap)+996(add 2)
      } else {
        assert.equal(reserves[0].toNumber(), 1001997)  // balance0 = 1000000(add 1)+1000(swap)+997(add 2)
        assert.equal(reserves[1].toNumber(), 1000000)  // balance1 = 1000000(add 1)-996(swap)+996(add 2)
      }
    })

    it('to a new pool including ETH', async () => {
      _pair = await UniswapV2Pair.at((await _factory.createPair(_token0.address, _weth.address)).logs[0].args.pair)

      const balanceBeforeAdd = await web3.eth.getBalance(bob)
      await _router.addLiquidityETH(
        _token0.address, 1000000, 0, 0, alice, 11571287987,
        {
          from: alice,
          value: "1000000"
        }
      )
      const txAddLiquidity = await _router.addLiquidityOneTokenETHExactETH(
        0, 0, 0, [_weth.address, _token0.address], bob, 11571287987,
        {
          from: bob,
          value: "2000"
        }
      )
      const tx = await web3.eth.getTransaction(txAddLiquidity.tx)
      const gasPrice = tx.gasPrice
      const fee = txAddLiquidity.receipt.gasUsed * Number(gasPrice)
      const balanceAfterAdd = await web3.eth.getBalance(bob)

      assert.equal((await _token0.balanceOf(bob)).toNumber(), 0)

      const value = _BN(balanceBeforeAdd).sub(_BN(balanceAfterAdd)).sub(_BN(fee))
      assert.equal(value, 1997) // 1000(swap) + 997 (add)
      assert.equal((await _pair.totalSupply()).toNumber(), 1000996)
      assert.equal((await _pair.balanceOf(bob)).toNumber(), 996)

      const reserves = await _pair.getReserves() // [_weth, _token0]
      if (_weth.address < _token0.address) {
        assert.equal(reserves[0].toNumber(), 1001997)  // balanceWETH = 1000000(add 1)+1000(swap)+997(add 2)
        assert.equal(reserves[1].toNumber(), 1000000) // balance0 = 1000000(add 1)-996(swap)+996(add 2)
      } else {
        assert.equal(reserves[1].toNumber(), 1001997)  // balanceWETH = 1000000(add 1)+1000(swap)+997(add 2)
        assert.equal(reserves[0].toNumber(), 1000000) // balance0 = 1000000(add 1)-996(swap)+996(add 2)
      }
    })
  })
})

function calculateSlippageAmount(value: CurrencyAmount, slippage: number): [JSBI, JSBI] {
  if (slippage < 0 || slippage > 10000) {
    throw Error(`Unexpected slippage value: ${slippage}`)
  }
  return [
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 - slippage)), JSBI.BigInt(10000)),
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 + slippage)), JSBI.BigInt(10000))
  ]
}