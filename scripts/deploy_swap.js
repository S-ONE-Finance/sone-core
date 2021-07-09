const hre = require("hardhat");
const ethers = hre.ethers;

const feeSetterAddress = process.env.FEE_SETTER_ADDRESS; // address of fee setter
const wethAddress = process.env.WETH_ADDRESS; // address of WETH

async function main() {
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  await hre.run('compile');

  // We get the contract to deploy
  const UniswapV2Factory = await hre.ethers.getContractFactory(
    "UniswapV2Factory"
  );
  const uniswapV2Factory = await UniswapV2Factory.deploy(feeSetterAddress);

  await uniswapV2Factory.deployed();

  console.log("UniswapV2Factory deployed to:", uniswapV2Factory.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
