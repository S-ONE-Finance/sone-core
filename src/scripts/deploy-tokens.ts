// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// const hre = require("hardhat");

import { BigNumber } from 'ethers'
import { run, ethers, config, network } from 'hardhat'
import { multiplize } from 'src/tasks/utils'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

import { TokenInfo } from '~/tasks/interface/contract-info.interface'

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await run('compile')

  const DEPLOYMENT_PATH = resolve('src/deployments')
  const DATA_PATH = resolve(DEPLOYMENT_PATH, 'data')
  const TOKEN_PATH = resolve(DATA_PATH, `tokens.${network.name}.json`)

  if (!existsSync(DATA_PATH)) {
    mkdirSync(DATA_PATH)
  }

  const tokenList: TokenInfo[] = []

  // We get the contract to deploy
  const FaucetToken = await ethers.getContractFactory('FaucetToken')
  const WETH9 = await ethers.getContractFactory('WETH9')

  // Tokens with 6 decimal places
  var decimalPlaces = 6
  var amount = multiplize(decimalPlaces, BigNumber.from(5000000000))

  const usdt = await FaucetToken.deploy(amount, 'TetherToken', decimalPlaces, 'USDT')
  const usdc = await FaucetToken.deploy(amount, 'USD Coin', decimalPlaces, 'USDC')

  // Tokens with 18 decimal places
  decimalPlaces = 18
  amount = multiplize(decimalPlaces, BigNumber.from(5000000000))
  const dai = await FaucetToken.deploy(BigInt(amount), 'DAI', decimalPlaces, 'DAI')
  const weth = await WETH9.deploy()

  console.log('USDT deployed to:', usdt.address)
  console.log('USDC deployed to:', usdc.address)
  console.log('DAI deployed to:', dai.address)
  console.log('WETH deployed to:', weth.address)

  tokenList.push(
    {
      address: usdt.address,
      decimals: await usdt.decimals(),
      name: await usdt.name(),
      symbol: await usdt.symbol(),
    },
    {
      address: usdc.address,
      decimals: await usdc.decimals(),
      name: await usdc.name(),
      symbol: await usdc.symbol(),
    },
    {
      address: dai.address,
      decimals: await dai.decimals(),
      name: await dai.name(),
      symbol: await dai.symbol(),
    },
    {
      address: weth.address,
      decimals: await weth.decimals(),
      name: await weth.name(),
      symbol: await weth.symbol(),
    }
  )
  writeFileSync(TOKEN_PATH, JSON.stringify(tokenList, null, 2))
  console.log(`Wrote data to file ${TOKEN_PATH}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
