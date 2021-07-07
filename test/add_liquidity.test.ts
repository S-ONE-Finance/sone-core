import BN from 'bn.js'
import { CurrencyAmount, Token, TokenAmount, Pair, ChainId, JSBI } from '@s-one-finance/sdk-core'
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

const MINIMUM_LIQUIDITY = 1000
const _BN = (str: string | number) => new BN(str)

function decimalize(amount: number, decimals: number): bigint {
  return BigInt(amount) * BigInt(10) ** BigInt(decimals)
}

contract('SoneSwapRouter - Add Liquidity', ([owner, alice, bob]) => {
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
    _router = await SoneSwapRouter.new(_factory.address, _weth.address, {
      from: owner,
    })
    _token0 = await MockERC20.new('TOKEN0', 'TOKEN0', '50000000', {
      from: owner,
    })
    _token1 = await MockERC20.new('TOKEN1', 'TOKEN1', '50000000', {
      from: owner,
    })

    // Transfer tokens to alice address
    await _token0.transfer(alice, 10000000, { from: owner })
    await _token1.transfer(alice, 10000000, { from: owner })

    // Approve allowance to spend alice's tokens for the _router
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
      // Add liquidity to a new pool
      await _router.addLiquidity(
        _token0.address,
        _token1.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        alice,
        11571287987,
        {
          from: alice,
        }
      )
      // Check reserves, total LP token and user's balance after adding at the first time
      assert.equal((await _pair.totalSupply()).toNumber(), 1000000, 'totalSupply equal to 1000000')
      assert.equal(
        (await _pair.balanceOf(alice)).toNumber(),
        1000000 - MINIMUM_LIQUIDITY,
        'user Balance equal to totalSupply - MINIMUM_LIQUIDITY'
      )
      const reserves = await _pair.getReserves()
      assert.equal(reserves[0].toNumber(), 1000000, 'reserves[0] equal to 1000000')
      assert.equal(reserves[1].toNumber(), 1000000, 'reserves[1] equal to 1000000')
    })

    it('to a existed pool excluding ETH', async () => {
      _pair = await UniswapV2Pair.at((await _factory.createPair(_token0.address, _token1.address)).logs[0].args.pair)

      let amountADesired: BN = _BN(1500000)
      let amountBDesired: BN = _BN(1000000)
      let amountAMin: BN = _BN(1500000)
      let amountBMin: BN = _BN(1000000)

      // Add liquidity to a new pool
      await _router.addLiquidity(
        _token0.address,
        _token1.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        alice,
        11571287987,
        {
          from: alice,
        }
      )

      // Check reserves and total LP token after adding at the first time
      const reservesBefore = await _pair.getReserves()
      const totalSupplyBefore = await _pair.totalSupply()

      assert.equal(reservesBefore[0].toNumber(), 1500000, 'reservesBefore[0] equal to 1500000')
      assert.equal(reservesBefore[1].toNumber(), 1000000, 'reservesBefore[1] equal to 1000000')
      assert.equal(totalSupplyBefore.toNumber(), 1224744, 'totalSupplyBefore equal to 1224744')

      // Prepare parameters to add liquidity for the second time
      enum Tokens {
        CURRENCY_A = 'CURRENCY_A',
        CURRENCY_B = 'CURRENCY_B',
      }
      const tokens: Token[] = [
        new Token(ChainId.MAINNET, _token0.address, (await _token0.decimals()).toNumber(), await _token0.symbol(), await _token0.name()),
        new Token(ChainId.MAINNET, _token1.address, (await _token1.decimals()).toNumber(), await _token1.symbol(), await _token1.name()),
      ]
      const pair = new Pair(
        new TokenAmount(tokens[0], reservesBefore[0].toString()),
        new TokenAmount(tokens[1], reservesBefore[1].toString())
      )

      const independentTokenAmount: TokenAmount = new TokenAmount(tokens[0], BigInt(1000000))
      const dependentTokenAmount: CurrencyAmount = pair.priceOf(tokens[0]).quote(new TokenAmount(tokens[0], independentTokenAmount.raw))
      const amounts: { [token in Tokens]: CurrencyAmount } = {
        [Tokens.CURRENCY_A]: independentTokenAmount,
        [Tokens.CURRENCY_B]: dependentTokenAmount,
      }

      const allowedSlippage = 100 // 1%
      const amountsMin = {
        [Tokens.CURRENCY_A]: calculateSlippageAmount(amounts.CURRENCY_A, allowedSlippage)[0],
        [Tokens.CURRENCY_B]: calculateSlippageAmount(amounts.CURRENCY_B, allowedSlippage)[0],
      }

      amountADesired = _BN(amounts.CURRENCY_A.raw.toString())
      amountBDesired = _BN(amounts.CURRENCY_B.raw.toString())
      amountAMin = _BN(amountsMin.CURRENCY_A.toString())
      amountBMin = _BN(amountsMin.CURRENCY_B.toString())

      // Add liquidity to a existed pool
      await _router.addLiquidity(
        _token0.address,
        _token1.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        alice,
        11571287987,
        {
          from: alice,
        }
      )

      // Info after adding the second time
      const totalSupplyAfter = await _pair.totalSupply()
      const reservesAfter = await _pair.getReserves()
      const amountAActual = _BN(reservesAfter[0].toString()).sub(_BN(reservesBefore[0].toString()))
      const amountBActual = _BN(reservesAfter[1].toString()).sub(_BN(reservesBefore[1].toString()))
      const aliceLPBalance = await _pair.balanceOf(alice)

      // Check added amounts
      assert.isAtLeast(amountAActual.toNumber(), amountAMin.toNumber(), 'amountAActual is greater or equal to amountAMin')
      assert.isAtLeast(amountBActual.toNumber(), amountBMin.toNumber(), 'amountAActual is greater or equal to amountAMin')
      assert.isAtMost(amountAActual.toNumber(), amountADesired.toNumber(), 'amountAActual is less than or equal to amountADesired')
      assert.isAtMost(amountBActual.toNumber(), amountBDesired.toNumber(), 'amountAActual is less than or equal to amountBDesired')
      // Check reserves of the pool after adding liquidity second time
      assert.equal(reservesAfter[0].toNumber(), 2500000, 'reservesAfter[0] equal to 2500000')
      assert.equal(reservesAfter[1].toNumber(), 1666666, 'reservesAfter[0] equal to 1666666')
      // Check total minted LP token of the pool and user's balance after adding liquidity second time
      assert.equal(totalSupplyAfter.toNumber(), 2041239, 'totalSupplyAfter equal to 2041239') // TO DO: explain minted LP token number
      assert.equal(
        aliceLPBalance.toNumber(),
        totalSupplyAfter.toNumber() - MINIMUM_LIQUIDITY,
        'aliceLPBalance equal to totalSupplyAfter - MINIMUM_LIQUIDITY'
      )
    })

    it('to a new pool including ETH', async () => {
      _pair = await UniswapV2Pair.at((await _factory.createPair(_token0.address, _weth.address)).logs[0].args.pair)

      const balanceBeforeAdd = await web3.eth.getBalance(alice)
      // Add liquidity to a new pool
      const txAddLiquidity = await _router.addLiquidityETH(_token0.address, 1000000, 0, 0, alice, 11571287987, {
        from: alice,
        value: '1000000',
      })
      const tx = await web3.eth.getTransaction(txAddLiquidity.tx)
      const fee = txAddLiquidity.receipt.gasUsed * Number(tx.gasPrice)
      const balanceAfterAdd = await web3.eth.getBalance(alice)

      const value = _BN(balanceBeforeAdd).sub(_BN(balanceAfterAdd)).sub(_BN(fee))
      // Check amount eth spent
      assert.equal(value.toNumber(), 1000000, 'Value ETH spent to add liquidity equal to 1000000')
      // Check reserves, total LP token and user's balance after adding at the first time
      assert.equal((await _pair.totalSupply()).toNumber(), 1000000, 'totalSupply equal to 1000000')
      assert.equal(
        (await _pair.balanceOf(alice)).toNumber(),
        1000000 - MINIMUM_LIQUIDITY,
        'user lp token Balance equal to totalSupply - MINIMUM_LIQUIDITY'
      )
      const reserves = await _pair.getReserves()
      assert.equal(reserves[0].toNumber(), 1000000, 'reserves[0] equal to 1000000')
      assert.equal(reserves[1].toNumber(), 1000000, 'reserves[1] equal to 1000000')
    })

    it('to a existed pool including ETH', async () => {
      _pair = await UniswapV2Pair.at((await _factory.createPair(_token0.address, _weth.address)).logs[0].args.pair)

      const balanceBeforeCreate = await web3.eth.getBalance(alice)
      // Add liquidity to a new pool
      const firstAddLiquidity = await _router.addLiquidityETH(_token0.address, 1000000, 0, 0, alice, 11571287987, {
        from: alice,
        value: '1000000',
      })

      let tx = await web3.eth.getTransaction(firstAddLiquidity.tx)
      let fee = firstAddLiquidity.receipt.gasUsed * Number(tx.gasPrice)
      const balanceAfterCreate = await web3.eth.getBalance(alice)
      let value = _BN(balanceBeforeCreate).sub(_BN(balanceAfterCreate)).sub(_BN(fee))
      const reservesBefore = await _pair.getReserves()
      const totalSupplyBefore = await _pair.totalSupply()
      // Check amount eth spent
      assert.equal(value.toNumber(), 1000000, 'Value ETH spent to add liquidity equal to 1000000')
      // Check reserves and total LP token after adding at the first time
      assert.equal(reservesBefore[0].toNumber(), 1000000, 'reservesBefore[0] equal to 1000000')
      assert.equal(reservesBefore[1].toNumber(), 1000000, 'reservesBefore[1] equal to 1000000')
      assert.equal(totalSupplyBefore.toNumber(), 1000000, 'totalSupplyBefore equal to 1000000')

      // Prepare parameters to add liquidity for the second time
      enum Tokens {
        CURRENCY_A = 'CURRENCY_A',
        CURRENCY_B = 'CURRENCY_B',
      }
      const tokens: Token[] = [
        new Token(ChainId.MAINNET, _token0.address, (await _token0.decimals()).toNumber(), await _token0.symbol(), await _token0.name()),
        new Token(ChainId.MAINNET, _weth.address, (await _weth.decimals()).toNumber(), await _weth.symbol(), await _weth.name()),
      ]
      const pair = new Pair(
        new TokenAmount(tokens[0], reservesBefore[0].toString()),
        new TokenAmount(tokens[1], reservesBefore[1].toString())
      )

      const dependentTokenAmount = pair.priceOf(tokens[0]).quote(new TokenAmount(tokens[0], BigInt(1500000)))

      const amounts: { [token in Tokens]: CurrencyAmount } = {
        [Tokens.CURRENCY_A]: new TokenAmount(tokens[0], BigInt(1500000)),
        [Tokens.CURRENCY_B]: new TokenAmount(tokens[1], dependentTokenAmount.raw),
      }
      const allowedSlippage = 100 // 1%
      const amountsMin = {
        [Tokens.CURRENCY_A]: calculateSlippageAmount(amounts.CURRENCY_A, allowedSlippage)[0],
        [Tokens.CURRENCY_B]: calculateSlippageAmount(amounts.CURRENCY_B, allowedSlippage)[0],
      }

      let amountADesired = _BN(amounts.CURRENCY_A.numerator.toString())
      let amountBDesired = _BN(amounts.CURRENCY_B.numerator.toString())
      let amountAMin = _BN(amountsMin.CURRENCY_A.toString())
      let amountBMin = _BN(amountsMin.CURRENCY_B.toString())

      // Add liquidity to a existed pool
      const txAddLiquidity = await _router.addLiquidityETH(_token0.address, amountADesired, amountAMin, amountBMin, alice, 11571287987, {
        from: alice,
        value: '1500000',
      })

      // Info after adding the second time
      const reservesAfter = await _pair.getReserves()
      const amountAActual = _BN(reservesAfter[0].toString()).sub(_BN(reservesBefore[0].toString()))
      const amountBActual = _BN(reservesAfter[1].toString()).sub(_BN(reservesBefore[1].toString()))
      const aliceLPBalance = await _pair.balanceOf(alice)
      tx = await web3.eth.getTransaction(txAddLiquidity.tx)
      fee = txAddLiquidity.receipt.gasUsed * Number(tx.gasPrice)
      const balanceAfterAdd = await web3.eth.getBalance(alice)
      // Check amount eth spent
      value = _BN(balanceAfterCreate).sub(_BN(balanceAfterAdd)).sub(_BN(fee))
      assert.equal(value.toNumber(), 1500000, 'value eth spent to add liquidity equal to 1500000')
      // Check added amounts
      assert.isAtLeast(amountAActual.toNumber(), amountAMin.toNumber(), 'amountAActual is greater or equal to amountAMin')
      assert.isAtLeast(amountBActual.toNumber(), amountBMin.toNumber(), 'amountAActual is greater or equal to amountAMin')
      assert.isAtMost(amountAActual.toNumber(), amountADesired.toNumber(), 'amountAActual is less than or equal to amountADesired')
      assert.isAtMost(amountBActual.toNumber(), amountBDesired.toNumber(), 'amountAActual is less than or equal to amountBDesired')
      // Check total minted LP token of the pool and user's balance after adding liquidity second time
      assert.equal((await _pair.totalSupply()).toNumber(), 2500000, 'totalSupplyAfter equal to 2041239')
      assert.equal(aliceLPBalance.toNumber(), 2500000 - MINIMUM_LIQUIDITY, 'aliceLPBalance equal to totalSupplyAfter - MINIMUM_LIQUIDITY')
      // Check reserves of the pool after adding liquidity second time
      assert.equal(reservesAfter[0].toNumber(), 2500000, 'reservesAfter[0] equal to 2500000')
      assert.equal(reservesAfter[1].toNumber(), 2500000, 'reservesAfter[1] equal to 2500000')
    })
  })

  describe('# add liquidity with 1 token', async () => {
    beforeEach(async () => {
      // Appove allowance to spend bob's tokens for the _router
      await _token0.approve(_router.address, 1000000, { from: bob })
      await _token1.approve(_router.address, 1000000, { from: bob })
    })

    it('to a existed pool excluding ETH', async () => {
      _pair = await UniswapV2Pair.at((await _factory.createPair(_token0.address, _token1.address)).logs[0].args.pair)

      await _token0.transfer(bob, 10000000, { from: owner })
      // add liquidity to new pool
      await _router.addLiquidity(_token0.address, _token1.address, 1000000, 1000000, 0, 0, ali  e, 11571287987, {
        from: alice,
      })
      // prepare for add liquidity one mode
      enum Tokens {
        CURRENCY_A = 'CURRENCY_A',
        CURRENCY_B = 'CURRENCY_B',
      }
      const tokens: Token[] = [
        new Token(ChainId.MAINNET, _token0.address, (await _token0.decimals()).toNumber(), await _token0.symbol(), await _token0.name()),
        new Token(ChainId.MAINNET, _token1.address, (await _token1.decimals()).toNumber(), await _token1.symbol(), await _token1.name()),
      ]
      const reservesBefore = await _pair.getReserves()
      const pair = new Pair(
        new TokenAmount(tokens[0], reservesBefore[0].toString()),
        new TokenAmount(tokens[1], reservesBefore[1].toString())
      )
      const wrappedUserInputParsedAmount = new TokenAmount(tokens[0], BigInt(20000))
      const [, theOtherTokenParsedAmount] = pair.getAmountsAddOneToken(wrappedUserInputParsedAmount)
      const allowedSlippage = 100 // 1%
      let amountOutMin = _BN(calculateSlippageAmount(theOtherTokenParsedAmount, allowedSlippage)[0].toString())

      const amounts: { [token in Tokens]: CurrencyAmount } = {
        [Tokens.CURRENCY_A]: new TokenAmount(tokens[0], BigInt(10000)),
        [Tokens.CURRENCY_B]: new TokenAmount(tokens[1], BigInt(amountOutMin.toNumber())),
      }
      let amountAMin = _BN(calculateSlippageAmount(amounts.CURRENCY_A, allowedSlippage)[0].toString())
      let amountBMin = _BN(calculateSlippageAmount(amounts.CURRENCY_B, allowedSlippage)[0].toString())

      await _router.addLiquidityOneToken(
        20000,
        amountAMin,
        amountBMin,
        amountOutMin,
        [_token0.address, _token1.address],
        bob,
        11571287987,
        {
          from: bob,
        }
      )
      // check token balance of user
      assert.equal((await _token0.balanceOf(bob)).toNumber(), 10000000 - 20000, 'bob token0 balance equal to 9980000')
      assert.equal((await _token1.balanceOf(bob)).toNumber(), 68, 'bob token1 balance equal to 68') // swap -9871 add 9803
      // check total supply and lp token of user balance
      assert.equal((await _pair.totalSupply()).toNumber(), 1009900, 'total supply equal to 1009900')
      assert.equal((await _pair.balanceOf(bob)).toNumber(), 9900, 'lp token balance equal to 9900')
      // check reserves
      const reserves = await _pair.getReserves() // [_token1, _token0]
      if (_token1.address < _token0.address) {
        assert.equal(reserves[1].toNumber(), 1020000, 'reserves[1] equal to 1020000') // balance1 = 1000000(add 1)+10000(swap)+10000(add 2)
        assert.equal(reserves[0].toNumber(), 999932, 'reserves[0] equal to 999932') // balance0 = 1000000(add 1)-9871(swap)+9803(add 2)
      } else {
        assert.equal(reserves[0].toNumber(), 1020000, 'reserves[0] equal to 1020000') // balance0 = 1000000(add 1)+10000(swap)+10000(add 2)
        assert.equal(reserves[1].toNumber(), 999932, 'reserves[1] equal to 999932') // balance1 = 1000000(add 1)-9871(swap)+9803(add 2)
      }
    })

    it('to a existed pool including ETH', async () => {
      _pair = await UniswapV2Pair.at((await _factory.createPair(_weth.address, _token0.address)).logs[0].args.pair)
      // get user eth balance
      const balanceBeforeAdd = await web3.eth.getBalance(bob)
      // add liquidity to new pool
      await _router.addLiquidityETH(_token0.address, 1000000, 0, 0, alice, 11571287987, {
        from: alice,
        value: '1000000',
      })
      // prepare for add liquidity one mode
      enum Tokens {
        CURRENCY_A = 'CURRENCY_A',
        CURRENCY_B = 'CURRENCY_B',
      }
      const tokens: Token[] = [
        new Token(ChainId.MAINNET, _weth.address, (await _weth.decimals()).toNumber(), await _weth.symbol(), await _weth.name()),
        new Token(ChainId.MAINNET, _token0.address, (await _token0.decimals()).toNumber(), await _token0.symbol(), await _token0.name()),
      ]
      const reservesBefore = await _pair.getReserves()
      const pair = new Pair(
        new TokenAmount(tokens[0], reservesBefore[0].toString()),
        new TokenAmount(tokens[1], reservesBefore[1].toString())
      )
      const wrappedUserInputParsedAmount = new TokenAmount(tokens[0], BigInt(20000))
      const [, theOtherTokenParsedAmount] = pair.getAmountsAddOneToken(wrappedUserInputParsedAmount)
      const allowedSlippage = 100 // 1%
      let amountOutMin = _BN(calculateSlippageAmount(theOtherTokenParsedAmount, allowedSlippage)[0].toString())

      const amounts: { [token in Tokens]: CurrencyAmount } = {
        [Tokens.CURRENCY_A]: new TokenAmount(tokens[0], BigInt(10000)),
        [Tokens.CURRENCY_B]: new TokenAmount(tokens[1], BigInt(amountOutMin.toNumber())),
      }
      let amountAMin = _BN(calculateSlippageAmount(amounts.CURRENCY_A, allowedSlippage)[0].toString())
      let amountBMin = _BN(calculateSlippageAmount(amounts.CURRENCY_B, allowedSlippage)[0].toString())
      const txAddLiquidity = await _router.addLiquidityOneTokenETHExactETH(
        amountBMin,
        amountAMin,
        amountOutMin,
        [_weth.address, _token0.address],
        bob,
        11571287987,
        {
          from: bob,
          value: '20000',
        }
      )
      const tx = await web3.eth.getTransaction(txAddLiquidity.tx)
      const gasPrice = tx.gasPrice
      const fee = txAddLiquidity.receipt.gasUsed * Number(gasPrice)
      const balanceAfterAdd = await web3.eth.getBalance(bob)

      // check user token0 balance
      assert.equal((await _token0.balanceOf(bob)).toNumber(), 68, 'bob token0 balance equal to 68')
      const value = _BN(balanceBeforeAdd).sub(_BN(balanceAfterAdd)).sub(_BN(fee))
      // check amount eth spent for add liquidity
      assert.equal(value.toNumber(), 20000, 'amount ETH spent equal to 20000') // 10000(swap) + 10000 (add)
      // check total supply and user's lp token balance
      assert.equal((await _pair.totalSupply()).toNumber(), 1009900, 'totalSupply equal to 1009900')
      assert.equal((await _pair.balanceOf(bob)).toNumber(), 9900, 'bob lp token balance equal to 9900')

      // check reserves
      const reserves = await _pair.getReserves() // [_weth, _token0]
      if (_weth.address < _token0.address) {
        assert.equal(reserves[0].toNumber(), 1020000, 'reserves[0] equal to 1020000') // balanceWETH = 1000000(add 1)+10000(swap)+10000(add 2)
        assert.equal(reserves[1].toNumber(), 999932, 'reserves[1] equal to 999932') // balance0 = 1000000(add 1)-9871(swap)+9803(add 2)
      } else {
        assert.equal(reserves[1].toNumber(), 1020000, 'reserves[1] equal to 1020000') // balanceWETH = 1000000(add 1)+10000(swap)+10000(add 2)
        assert.equal(reserves[0].toNumber(), 999932, 'reserves[0] equal to 999932') // balance0 = 1000000(add 1)-9871(swap)+9803(add 2)
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
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 + slippage)), JSBI.BigInt(10000)),
  ]
}
