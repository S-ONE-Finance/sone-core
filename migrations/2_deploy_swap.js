const UniswapV2Factory = artifacts.require("UniswapV2Factory");
const SoneSwapRouter = artifacts.require("SoneSwapRouter");

// address of fee setter
const feeSetterAddress = "0xAe7fD93a1419dee1376c0b9E27C969E85679AFd2";
// address of WETH
const wethAddress = "0xc778417E063141139Fce010982780140Aa0cD5Ab";

module.exports = async function (deployer) {
  // deploy factory
  await deployer.deploy(UniswapV2Factory, feeSetterAddress);
  // deploy router
  const factory = await UniswapV2Factory.deployed();
  await deployer.deploy(SoneSwapRouter, factory.address, wethAddress);
};
