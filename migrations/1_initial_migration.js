const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  deployer.deploy(Migrations, {
    overwrite: false,
    gas: Math.round(130486 * 1.1) // Used Gas = 90.1% Gas Limit
  });
};
