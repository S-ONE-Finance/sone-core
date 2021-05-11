const SoneMasterFarmer = artifacts.require("SoneMasterFarmer");

const devAddresses = process.env.OPERATOR_ADDRESS || process.env.LOCAL_OPERATOR_ADDRESS;
const rewardPerBlock = 10;
const startBlock = 1;
const halvingAfterBlock = 720;
const soneTokenAddress = process.env.SONE_ADDRESS;

module.exports = async function(deployer) {
    await deployer.deploy(SoneMasterFarmer, soneTokenAddress, devAddresses, rewardPerBlock, startBlock, halvingAfterBlock);
};
