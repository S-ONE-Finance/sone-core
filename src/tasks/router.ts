import { task, types } from 'hardhat/config'
import { Pair, TokenAmount, Token, ChainId } from '@s-one-finance/sdk-core'

import { accountToSigner, tokenNameToAddress } from 'src/tasks/utils'
import soneSwap from 'src/deployments/sone-swap.json'

import {
  SoneSwapRouter,
  SoneSwapRouter__factory,
  UniswapV2Factory,
  UniswapV2Pair__factory,
  TetherToken__factory,
} from 'src/types'
import { BigNumber } from 'ethers'

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
      const [selectedTokenAddress, theOtherTokenAddress] = tokenNameToAddress(selectedToken, theOtherToken)

      const router = SoneSwapRouter__factory.connect(soneSwap.Router, senderSigner)

      await hre.run('erc20:approve', {
        token: selectedTokenAddress,
        from: senderSigner.address,
        spender: router.address,
      })
      await hre.run('erc20:approve', {
        token: theOtherTokenAddress,
        from: senderSigner.address,
        spender: router.address,
      })

      console.log('selectedTokenAddress :>> ', selectedTokenAddress)
      console.log('theOtherTokenAddress :>> ', theOtherTokenAddress)
      console.log('selectedTokenDesired :>> ', selectedTokenDesired)
      console.log('theOtherTokenDesired :>> ', theOtherTokenDesired)
      console.log('selectedTokenMinimum :>> ', selectedTokenMinimum)
      console.log('theOtherTokenMinimum :>> ', theOtherTokenMinimum)
      console.log('toSigner :>> ', toSigner.address)
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
          BigNumber.from(deadline)
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
    const router = await hre.ethers.getContractAt('UniswapV2Router', soneSwap.Router)
    await hre.run('erc20:approve', { token, spender: router.address })
    await (
      await router
        .connect((await accountToSigner(hre, 'owner'))?.[0])
        .addLiquidityETH(token, tokenDesired, tokenMinimum, ethMinimum, to, deadline)
    ).wait()
  })

task('router:swap', 'Router swap')
  .addParam('selectedToken', 'Selected token')
  .addParam('theOtherToken', 'The other token')
  .addParam('inputAmount', 'Input amount')
  .addParam('to', 'To')
  .addOptionalParam('deadline', 'transaction deadline', Number.MAX_SAFE_INTEGER.toString(), types.string)
  .setAction(async ({ selectedToken, theOtherToken, inputAmount }, hre) => {
    const [signer] = await accountToSigner(hre, 'owner')
    const factory = (await hre.ethers.getContractAt('UniswapV2Factory', soneSwap.Factory)) as UniswapV2Factory
    const router = (await hre.ethers.getContractAt('SoneSwapRouter', soneSwap.Router)) as SoneSwapRouter
    const [selectedTokenAddress, theOtherTokenAddress] = tokenNameToAddress(selectedToken, theOtherToken)

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

    const inputTokenAmount = new TokenAmount(_selectedToken, inputAmount)

    const [amountOut] = pair.getOutputAmount(inputTokenAmount)

    console.log('amountOut :>> ', amountOut.raw.toString())

    // await hre.run('erc20:approve', { token: selectedTokenAddress, spender: router.address })
    await hre.run('erc20:approve', { token: theOtherTokenAddress, from: signer.address, spender: router.address })
    // await (await router.connect((await accountToSigner(hre, 'owner'))?.[0]).swapTokensForExactTokens()).wait()
  })
