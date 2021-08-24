import { ethers, network } from 'hardhat'
import * as hre from 'hardhat'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

import { tokenNameToAddress } from '~/tasks/utils'
import { SoneContracts } from '~/tasks/interface/contract-info.interface'

async function main() {
  const DEPLOYMENT_PATH = resolve('src/deployments')
  const DATA_PATH = resolve(DEPLOYMENT_PATH, 'data')
  const SONE_PATH = resolve(DATA_PATH, `sone-defi.${network.name}.json`)

  if (!existsSync(DATA_PATH)) {
    mkdirSync(DATA_PATH)
  }

  let contracts: SoneContracts

  // Params
  const [wethAddress, soneAddress] = tokenNameToAddress(hre, 'weth', 'sone')
  const feeSetter = process.env.FEE_SETTER_ADDRESS || (process.env.PRIVATE_FEE_SETTER_ADDRESS as string)
  const devAddresses = process.env.OPERATOR_ADDRESS || (process.env.PRIVATE_OPERATOR_ADDRESS as string)
  const rewardPerBlock = '5000000000000000000' // reward per block
  const startBlock = 10890583 // Blocker number 13546394 (on mainnet) ~ 2021-11-1 00:00 +08 timezone
  const halvingAfterBlock = 45134 // Number block for a week ~ 13.4s / block

  // We get the contract to deploy
  const Factory = await ethers.getContractFactory('UniswapV2Factory')
  const Router = await ethers.getContractFactory('SoneSwapRouter')
  const MasterFarmeruter = await ethers.getContractFactory('SoneMasterFarmer')

  const factory = await Factory.deploy(feeSetter)
  const router = await Router.deploy(factory.address, wethAddress)
  const masterFarmeruter = await MasterFarmeruter.deploy(
    soneAddress,
    devAddresses,
    rewardPerBlock,
    startBlock,
    halvingAfterBlock
  )

  console.log('Factory deployed to:', factory.address)
  console.log('Router deployed to:', router.address)
  console.log('MasterFarmeruter deployed to:', masterFarmeruter.address)

  contracts = {
    factory: factory.address,
    router: router.address,
    masterFarmer: masterFarmeruter.address,
  }

  writeFileSync(SONE_PATH, JSON.stringify(contracts, null, 2))
  console.log(`Wrote data to file ${SONE_PATH}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
