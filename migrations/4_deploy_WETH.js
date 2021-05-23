const WETH9 = artifacts.require("WETH9");

module.exports = async function (deployer) {
    deployer.deploy(WETH9, {
        overwrite: false
    });
};
