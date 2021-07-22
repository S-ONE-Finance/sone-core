// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// const hre = require("hardhat");

import { BigNumber } from 'ethers'
import { run, ethers } from 'hardhat'
import { multiplize } from 'src/tasks/utils'

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  await run('compile')

  // const accounts = await ethers.get
  // We get the contract to deploy
  var decimalPlaces = 6
  var amount = multiplize(decimalPlaces, BigNumber.from(5000000000))

  const USDT = await ethers.getContractFactory('FaucetToken')
  const usdt = await USDT.deploy(amount, 'TetherToken', decimalPlaces, 'USDT')
  const usdc = await USDT.deploy(amount, 'USD Coin', decimalPlaces, 'USDC')
  decimalPlaces = 18
  amount = multiplize(decimalPlaces, BigNumber.from(5000000000))
  const dai = await USDT.deploy(BigInt(amount), 'DAI', decimalPlaces, 'DAI')

  await usdt.deployed()
  await usdc.deployed()
  await dai.deployed()

  console.log('USDT deployed to:', usdt.address)
  console.log('USDC deployed to:', usdc.address)
  console.log('DAI deployed to:', dai.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
