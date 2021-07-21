// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// const hre = require("hardhat");

import { run, ethers } from 'hardhat'

import soneSwap from 'src/deployments/sone-swap.json'
import tokens from 'src/deployments/erc-20-tokens.json'

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  await run('compile')

  // const accounts = await ethers.get
  // We get the contract to deploy

  const Router = await ethers.getContractFactory('SoneSwapRouter')
  const router = await Router.deploy(soneSwap.Factory, tokens.WETH)

  await router.deployed()

  console.log('router deployed to:', router.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
