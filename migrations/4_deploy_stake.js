const SoneToken = artifacts.require("SoneToken");
const SoneMasterFarmer = artifacts.require("SoneMasterFarmer");

const devAddresses = process.env.OPERATOR_ADDRESS || process.env.LOCAL_OPERATOR_ADDRESS;
const lockFromBlock = 1;
const lockToBlock = 10;
const rewardPerBlock = 10;
const startBlock = 1;
const halvingAfterBlock = 720;

module.exports = async function(deployer) {
    await deployer.deploy(SoneToken, lockFromBlock, lockToBlock);
    const sone = await SoneToken.deployed();
    await deployer.deploy(SoneMasterFarmer, sone.address, devAddresses, rewardPerBlock,startBlock, halvingAfterBlock);
};
