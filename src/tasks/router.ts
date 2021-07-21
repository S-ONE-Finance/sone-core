import { task, types } from 'hardhat/config'

import { accountToSigner, tokenNameToAddress } from 'src/tasks/utils'
import soneSwap from 'src/deployments/sone-swap.json'

import { UniswapV2ERC20__factory, SoneSwapRouter, SoneSwapRouter__factory } from 'src/types'
import { ethers, Signer } from 'ethers'

const MAX_INT = ethers.constants.MaxInt256

task('erc20:approve', 'ERC20 approve')
  .addParam('token', 'Token')
  .addParam('spender', 'Spender')
  .addOptionalParam('deadline', 'transaction deadline', Number.MAX_SAFE_INTEGER.toString(), types.string)
  .setAction(async ({ token, spender, deadline }, hre) => {
    const [signer] = await accountToSigner(hre, 'owner')
    const slp = UniswapV2ERC20__factory.connect(token, signer)

    await (await slp.connect(signer).approve(spender, deadline)).wait()
  })

task('router:add-liquidity', 'Router add liquidity')
  .addParam('tokenA', `Token A address: 'usdt', 'usdc', 'dai' or another token address`)
  .addParam('tokenB', `Token B address: 'usdt', 'usdc', 'dai' or another token address`)
  .addParam('tokenADesired', 'Token A Desired')
  .addParam('tokenBDesired', 'Token B Desired')
  .addParam('tokenAMinimum', 'Token A Minimum')
  .addParam('tokenBMinimum', 'Token B Minimum')
  .addParam('to', `To: 'owner', 'alice', 'bob' or another address`)
  .addOptionalParam('deadline', 'transaction deadline', Number.MAX_SAFE_INTEGER.toString(), types.string)
  .setAction(
    async ({ tokenA, tokenB, tokenADesired, tokenBDesired, tokenAMinimum, tokenBMinimum, to, deadline }, hre) => {
      const [sender, toAddress] = await accountToSigner(hre, 'owner', to)
      const [tokenAAddress, tokenBAddress] = tokenNameToAddress(tokenA, tokenB)
      
      const router = SoneSwapRouter__factory.connect(soneSwap.Router, sender)

      await hre.run('erc20:approve', { token: tokenAAddress, spender: router.address })
      await hre.run('erc20:approve', { token: tokenBAddress, spender: router.address })
      console.log('tokenAAddress :>> ', tokenAAddress)
      console.log('tokenBAddress :>> ', tokenBAddress)
      console.log('tokenADesired :>> ', tokenADesired)
      console.log('tokenBDesired :>> ', tokenBDesired)
      await (
        await router
          .connect(sender)
          .addLiquidity(
            tokenAAddress,
            tokenBAddress,
            tokenADesired,
            tokenBDesired,
            tokenAMinimum,
            tokenBMinimum,
            toAddress.address,
            deadline,
            {
              from: sender.address,
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
    const router = await hre.ethers.getContractAt('UniswapV2Router', soneSwap.Router)
    await hre.run('erc20:approve', { token, spender: router.address })
    await (
      await router
        .connect((await accountToSigner(hre, 'owner'))?.[0])
        .addLiquidityETH(token, tokenDesired, tokenMinimum, ethMinimum, to, deadline)
    ).wait()
  })
