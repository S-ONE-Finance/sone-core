const HDWalletProvider = require('@truffle/hdwallet-provider');
const infuraProjectID = "1ee30a55a9084dbb91741085ccc9df47";
const mnemonic = 'demand layer display heavy refuse maximum dash pool scheme mosquito neutral flag';

module.exports = {
  contracts_directory: "./ethereum-contracts",
  networks: {
    dev: {
      host: "localhost",
      port: 7545,
      network_id: "*", // Match any network id
      gas: 5000000
    },
    // tomodev: {
    //   host: "https://rpc.devnet.tomochain.com",
    //   gas: 5000000,
    //   network_id: 99
    // }
    ropsten: {
      provider: () => new HDWalletProvider(
        mnemonic, 
        `https://ropsten.infura.io/v3/${infuraProjectID}`
      ),
      network_id: 3,       // Ropsten's id
      gas: 5500000,        // Ropsten has a lower block limit than mainnet
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
  },
  compilers: {
    solc: {
      version: "0.6.12",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};