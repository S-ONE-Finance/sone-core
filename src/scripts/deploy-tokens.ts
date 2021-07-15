// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// const hre = require("hardhat");

import { run, ethers } from 'hardhat'

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  await run('compile')

  // const accounts = await ethers.get
  // We get the contract to deploy
  const USDT = await ethers.getContractFactory('TetherToken')
  const usdt = await USDT.deploy(1000000000000000, 'TetherToken', 'USDT', 6)
  const usdc = await USDT.deploy(1000000000000000, 'USD Coin', 'USDC', 6)
  const dai = await USDT.deploy(BigInt('1000000000000000000000000000'), 'DAI', 'DAI', 18)

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
