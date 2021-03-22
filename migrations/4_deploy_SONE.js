const SoneToken = artifacts.require("SoneToken");

const lockFromBlock = 1;
const lockToBlock = 10;

module.exports = async function(deployer) {
    await deployer.deploy(SoneToken, lockFromBlock, lockToBlock, {
        from: process.env.OPERATOR_ADDRESS || process.env.LOCAL_OPERATOR_ADDRESS    // Leave blank to using default accounts[0]
    });
};
