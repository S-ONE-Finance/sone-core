import { task, types } from 'hardhat/config'
import { Pair, TokenAmount, Token, ChainId } from '@s-one-finance/sdk-core'

import { accountToSigner, getCommonTokens, getSoneContracts, tokenNameToAddress } from 'src/tasks/utils'

import {
  SoneSwapRouter,
  SoneSwapRouter__factory,
  UniswapV2Factory,
  UniswapV2Pair__factory,
  TetherToken__factory,
  WETH9__factory,
  WETH9,
  UniswapV2ERC20__factory,
} from 'src/types'

task('router:add-liquidity', 'Router add liquidity')
  .addParam('selectedToken', `Token A address: 'usdt', 'usdc', 'dai', 'sone' or another token address`)
  .addParam('theOtherToken', `Token B address: 'usdt', 'usdc', 'dai', 'sone' or another token address`)
  .addParam('selectedTokenDesired', 'Token A Desired')
  .addParam('theOtherTokenDesired', 'Token B Desired')
  .addParam('selectedTokenMinimum', 'Token A Minimum')
  .addParam('theOtherTokenMinimum', 'Token B Minimum')
  .addParam('to', `To: 'owner', 'alice', 'bob' or another address`)
  .addOptionalParam('deadline', 'transaction deadline', Number.MAX_SAFE_INTEGER.toString(), types.string)
  .setAction(
    async (
      {
        selectedToken,
        theOtherToken,
        selectedTokenDesired,
        theOtherTokenDesired,
        selectedTokenMinimum,
        theOtherTokenMinimum,
        to,
        deadline,
      },
      hre
    ) => {
      const [senderSigner, toSigner] = await accountToSigner(hre, 'owner', to)
      const [selectedTokenAddress, theOtherTokenAddress] = tokenNameToAddress(hre, selectedToken, theOtherToken)

      const soneContracts = getSoneContracts(hre.network.name)
      const router = SoneSwapRouter__factory.connect(soneContracts?.router as string, senderSigner)

      await hre.run('erc20:approve', {
        token: selectedTokenAddress,
        from: senderSigner.address,
        spender: router.address,
        amount: selectedTokenDesired,
      })
      await hre.run('erc20:approve', {
        token: theOtherTokenAddress,
        from: senderSigner.address,
        spender: router.address,
        amount: theOtherTokenDesired,
      })

      console.log('selectedTokenAddress :>> ', selectedTokenAddress)
      console.log('theOtherTokenAddress :>> ', theOtherTokenAddress)
      console.log('selectedTokenDesired :>> ', selectedTokenDesired)
      console.log('theOtherTokenDesired :>> ', theOtherTokenDesired)

      console.log(
        'selected balance :>> ',
        (
          await UniswapV2ERC20__factory.connect(selectedTokenAddress, senderSigner).balanceOf(senderSigner.address)
        ).toString()
      )
      console.log(
        'theOther balance :>> ',
        (
          await UniswapV2ERC20__factory.connect(theOtherTokenAddress, senderSigner).balanceOf(senderSigner.address)
        ).toString()
      )
      console.log('selectedTokenMinimum :>> ', selectedTokenMinimum)
      console.log('theOtherTokenMinimum :>> ', theOtherTokenMinimum)
      console.log('toSigner.address :>> ', toSigner.address)
      console.log('deadline :>> ', deadline)

      await (
        await router.addLiquidity(
          selectedTokenAddress,
          theOtherTokenAddress,
          selectedTokenDesired,
          theOtherTokenDesired,
          selectedTokenMinimum,
          theOtherTokenMinimum,
          toSigner.address,
          deadline,
          {
            gasLimit: process.env.GAS_LIMIT,
          }
        )
      ).wait()
    }
  )

task('router:add-liquidity-eth', 'Router add liquidity eth')
  .addParam('token', 'Token')
  .addParam('tokenDesired', 'Token Desired')
  .addParam('tokenMinimum', 'Token Minimum')
  .addParam('ethMinimum', 'ETH Minimum')
  .addParam('to', 'To')
  .addOptionalParam('deadline', 'transaction deadline', Number.MAX_SAFE_INTEGER.toString(), types.string)
  .setAction(async ({ token, tokenDesired, tokenMinimum, ethMinimum, to, deadline }, hre) => {
    const [senderSigner, toSigner] = await accountToSigner(hre, 'owner', to)
    const [tokenAddress] = tokenNameToAddress(hre, token)
    const soneContracts = getSoneContracts(hre.network.name)
    let weth: WETH9 = WETH9__factory.connect('', senderSigner)
    const router = SoneSwapRouter__factory.connect(soneContracts?.router as string, senderSigner)
    console.log('soneContracts?.router :>> ', await router.factory())

    await hre.run('erc20:approve', {
      token: tokenAddress,
      from: senderSigner.address,
      spender: router.address,
    })

    console.log('tokenAddress :>> ', await router.WETH())
    console.log('deadline :>> ', deadline)

    await (
      await router.addLiquidityETH(tokenAddress, tokenDesired, tokenMinimum, ethMinimum, to, 11571287987, {
        value: '10000000000000000000',
        from: senderSigner.address,
      })
    ).wait()
  })

task('router:swap', 'Router swap')
  .addParam('selectedToken', 'Selected token')
  .addParam('theOtherToken', 'The other token')
  .addParam('inputAmount', 'Input amount')
  .addParam('to', 'To')
  .addOptionalParam('deadline', 'transaction deadline', Number.MAX_SAFE_INTEGER.toString(), types.string)
  .setAction(async ({ selectedToken, theOtherToken, inputAmount, to, deadline }, hre) => {
    const [signer, toSigner] = await accountToSigner(hre, 'owner', to)
    const soneContracts = getSoneContracts(hre.network.name)
    const factory = (await hre.ethers.getContractAt(
      'UniswapV2Factory',
      soneContracts?.factory as string
    )) as UniswapV2Factory
    const router = (await hre.ethers.getContractAt('SoneSwapRouter', soneContracts?.router as string)) as SoneSwapRouter
    const [selectedTokenAddress, theOtherTokenAddress] = tokenNameToAddress(hre, selectedToken, theOtherToken)

    const pairAddress = await factory.getPair(selectedTokenAddress, theOtherTokenAddress)
    const _pair = UniswapV2Pair__factory.connect(pairAddress, signer)
    const reservesBefore = await _pair.getReserves()

    const _selectedTokenContract = TetherToken__factory.connect(selectedTokenAddress, signer)
    const _theOtherTokenContract = TetherToken__factory.connect(theOtherTokenAddress, signer)

    const [_selectedToken, _theOtherToken]: Token[] = [
      new Token(
        ChainId.MAINNET,
        selectedTokenAddress,
        (await _selectedTokenContract.decimals()).toNumber(),
        await _selectedTokenContract.symbol(),
        await _selectedTokenContract.name()
      ),
      new Token(
        ChainId.MAINNET,
        _theOtherTokenContract.address,
        (await _theOtherTokenContract.decimals()).toNumber(),
        await _theOtherTokenContract.symbol(),
        await _theOtherTokenContract.name()
      ),
    ]

    const pair = new Pair(
      new TokenAmount(_selectedToken, reservesBefore[0].toString()),
      new TokenAmount(_theOtherToken, reservesBefore[1].toString())
    )

    const inputTokenAmount = new TokenAmount(pair.token0.address == _selectedToken.address ? _selectedToken : _theOtherToken, inputAmount)

    const [amountOut] = pair.getOutputAmount(inputTokenAmount)

    console.log('amountOut :>> ', amountOut.raw.toString())

    await hre.run('erc20:approve', {
      token: selectedTokenAddress,
      from: signer.address,
      spender: router.address,
      amount: inputAmount,
    })
    await (
      await router.swapTokensForExactTokens(
        amountOut.raw.toString(),
        inputAmount,
        [selectedTokenAddress, theOtherTokenAddress],
        toSigner.address,
        deadline
      )
    ).wait()
  })
