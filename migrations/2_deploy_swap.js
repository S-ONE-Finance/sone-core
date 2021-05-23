const UniswapV2Factory = artifacts.require("UniswapV2Factory");
const SoneSwapRouter = artifacts.require("SoneSwapRouter");


const feeSetterAddress = process.env.FEE_SETTER_ADDRESS; // address of fee setter
const wethAddress = process.env.WETH_ADDRESS; // address of WETH

module.exports = async function (deployer) {
  // deploy factory
  await deployer.deploy(
    UniswapV2Factory,
    feeSetterAddress,
    // {
    //   overwrite: false
    // }
  );

  // deploy router
  const factory = await UniswapV2Factory.deployed();
  await deployer.deploy(
    SoneSwapRouter,
    factory.address,
    wethAddress,
    // {
    //   overwrite: false
    // }
  );
}
