const WETH9 = artifacts.require("WETH9");

module.exports = async function (deployer, network) {
    if (network == 'testing_ropsten') return
    
    deployer.deploy(WETH9, {
        overwrite: false
    });
};
