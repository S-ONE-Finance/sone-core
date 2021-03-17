const UniswapV2Factory = artifacts.require("UniswapV2Factory");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");

// address of fee setter
const feeSetterAddress = "0xAe7fD93a1419dee1376c0b9E27C969E85679AFd2";
// address of WETH
const wethAddress = "0x070425a10c4132eeaB8cFbc369150A20EFFaC799";

module.exports = async function (deployer) {
  // deploy factory
  await deployer.deploy(UniswapV2Factory, feeSetterAddress);
  // deploy router
  const factory = await UniswapV2Factory.deployed();
  await deployer.deploy(UniswapV2Router02, factory.address, wethAddress);
};
