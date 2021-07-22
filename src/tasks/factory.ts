import { task, types } from 'hardhat/config'

import { accountToSigner, tokenNameToAddress } from 'src/tasks/utils'
import soneSwap from 'src/deployments/sone-swap.json'

import { UniswapV2Factory__factory, UniswapV2Pair__factory } from 'src/types'
import { ethers, Signer } from 'ethers'

const MAX_INT = ethers.constants.MaxInt256

task('factory:get-pair', 'Get pair info')
  .addParam('pairAddress', 'Pair address')
  .setAction(async ({ pairAddress }, hre) => {
    const [signer] = await accountToSigner(hre, 'owner')
    const pair = UniswapV2Pair__factory.connect(pairAddress, signer)

    const token0 = await pair.token0()
    const token1 = await pair.token1()

    console.log('token0 :>> ', token0)
    console.log('token1 :>> ', token1)
  })
