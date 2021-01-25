const SoneToken = artifacts.require("SoneToken");
const SoneMasterFarmer = artifacts.require("SoneMasterFarmer");

const lockFromBlock = 1;
const lockToBlock = 10;
const devAddresses = "0x88Cac51E652c4eD234aC461880dD0bd714ca5a1f";
const rewardPerBlock = 10;
const startBlock = 1;
const halvingAfterBlock = 720;

module.exports = async function(deployer) {
    await deployer.deploy(SoneToken, lockFromBlock, lockToBlock);
    const sone = await SoneToken.deployed();
    await deployer.deploy(SoneMasterFarmer, sone.address, devAddresses, rewardPerBlock,startBlock, halvingAfterBlock);
};
