const SoneMasterFarmer = artifacts.require("SoneMasterFarmer");

const devAddresses = process.env.OPERATOR_ADDRESS || process.env.LOCAL_OPERATOR_ADDRESS;
const rewardPerBlock = 5;   // reward per block
const startBlock = 13546394; // Blocker number 13546394 (on mainnet) ~ 2021-11-1 00:00 +08 timezone
const halvingAfterBlock = 45134; // Number block for week ~ 13.4s / block
const soneTokenAddress = process.env.SONE_ADDRESS;

module.exports = async function (deployer) {
    await deployer.deploy(
        SoneMasterFarmer,
        soneTokenAddress,
        devAddresses,
        rewardPerBlock,
        startBlock,
        halvingAfterBlock
    );
}
