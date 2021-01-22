const UniswapV2Factory = artifacts.require("UniswapV2Factory");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");

// address of fee setter 
const feeSetterAddress = "0x88Cac51E652c4eD234aC461880dD0bd714ca5a1f";
// address of WETH
const wethAddress = "0x71C5C47d7099E22A4A267495658F7eDE8E55364f";

module.exports = async function(deployer) {
    // deploy factory
    await deployer.deploy(UniswapV2Factory, feeSetterAddress);
    // deploy router
    const factory = await UniswapV2Factory.deployed();
    await deployer.deploy(UniswapV2Router02, factory.address, wethAddress);
};
