// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from 'hardhat'

import { TetherToken__factory, TetherToken } from 'src/types'

async function main() {
  const [owner, alice, bob] = await ethers.getSigners()
  let usdt: TetherToken = TetherToken__factory.connect('0xb790ff34d3E1d681e5f1Cb8C258ce2722451c401', owner)
  console.log(`Owner's balance :>> `, await (await usdt.balanceOf(owner.address)).toNumber())
  console.log(`Alice's balance :>> `, await (await usdt.balanceOf(alice.address)).toNumber())

  // console.log('balance :>> ', usdt.);

  // artifacts.readArtifact('TetherToken')
  // const usdt = USDT.attach('0x43d59Fa74AD4A655923f992888A225d6d83e9e2F')
  // // await usdt.deployed()

  // const usdtInstance = new ethers.Contract(usdt.address, usdt.interface, usdt.signer)

  // console.log('USDT deployed to:', usdtInstance.address)
  // console.log('Balance :>> ', (await usdtInstance.functions.)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
