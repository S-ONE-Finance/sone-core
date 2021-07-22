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
  var decimalPlaces = 18

  const SONE = await ethers.getContractFactory('FaucetToken')
  decimalPlaces = 18
  // const sone = await SONE.deploy(BigInt(amount), 'DAI', decimalPlaces, 'DAI')

  // await sone.deployed()

  // console.log('SONE deployed to:', sone.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
