import { ethers, network } from 'hardhat'
import * as hre from 'hardhat'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

import { tokenNameToAddress, accountToSigner } from '~/tasks/utils'
import { SoneContracts } from '~/tasks/interface/contract-info.interface'
import { SoneToken, SoneToken__factory } from '~/types'

async function main() {
  let [owner] = await accountToSigner(hre, 'owner')
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
  const feeTo = process.env.FEE_TO_ADDRESS || process.env.FEE_SETTER_ADDRESS as string
  const rewardPerBlock = '5000000000000000000' // reward per block
  const startBlock = 13723975 // Blocker number 13546394 (on mainnet) ~ 2021-11-1 00:00 +08 timezone
  const halvingAfterBlock = 45134 // Number block for a week ~ 13.4s / block

  // We get the contract to deploy
  const Factory = await ethers.getContractFactory('UniswapV2Factory')
  const Router = await ethers.getContractFactory('SoneSwapRouter')
  const MasterFarmer = await ethers.getContractFactory('SoneMasterFarmer')
  const SoneConvert = await ethers.getContractFactory('SoneConvert')

  const factory = await Factory.deploy(feeSetter)
  console.log('Factory deployed to:', factory.address)
  
  const router = await Router.deploy(factory.address, wethAddress)
  console.log('Router deployed to:', router.address)

  const masterFarmer = await MasterFarmer.deploy(
    soneAddress,
    devAddresses,
    rewardPerBlock,
    startBlock,
    halvingAfterBlock
  )
  console.log('MasterFarmer deployed to:', masterFarmer.address)

  let _sone: SoneToken = SoneToken__factory.connect(soneAddress, owner)

  const soneConvert = await SoneConvert.deploy(soneAddress, wethAddress, factory.address, router.address)
  console.log('SoneConvert deployed to:', soneConvert.address)

  // factory set address
  // TODO: khi run script, chú ý thêm account feeSetter vào hardhat config, để connect với factory setFeeTo setWithdrawFeeTo setSoneConvert
  await (await factory.setFeeTo(feeTo)).wait()
  await (await factory.setWithdrawFeeTo(feeTo)).wait()
  await (await factory.setSoneConvert(soneConvert.address)).wait()
  // transfer ownership sone to masterFarmer
  await (await _sone.transferOwnership(masterFarmer.address)).wait()

  contracts = {
    factory: factory.address,
    router: router.address,
    masterFarmer: masterFarmer.address,
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
