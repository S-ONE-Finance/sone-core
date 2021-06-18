/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * trufflesuite.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

 require('dotenv').config();
 const HDWalletProvider = require('@truffle/hdwallet-provider');
 
 module.exports = {
   /**
    * Networks define how you connect to your ethereum client and let you set the
    * defaults web3 uses to send transactions. If you don't specify one truffle
    * will spin up a development blockchain for you on port 9545 when you
    * run `develop` or `test`. You can ask a truffle command to use a specific
    * network from the command line, e.g
    *
    * $ truffle test --network <network-name>
    */
 
   networks: {
     // Useful for testing. The `development` name is special - truffle uses it by default
     // if it's defined here and no other network is specified at the command line.
     // You should run a client (like ganache-cli, geth or parity) in a separate terminal
     // tab if you use this network and you must also set the `host`, `port` and `network_id`
     // options below to some value.
     //
     dev: {
       host: "127.0.0.1",     // Localhost (default: none)
       port: 7545,            // Standard Ethereum port (default: none)
       network_id: "*",       // Any network (default: none)
       gas: process.env.LOCAL_GAS_LIMIT,           // Ganache has a lower block limit than mainnet 12,500,000. MAXIMUM Ropsten Block GAS_LIMIT = 6,721,975
       gasPrice: process.env.LOCAL_GAS_PRICE       // Default gasPrice to send a transaction
     },
     testing_ropsten: {
      provider: () => new HDWalletProvider( // Using MNEMONIC or PRIVATE_KEY
        process.env.MNEMONIC,
       //  process.env.OPERATOR_PRIVATE_KEY,
        // `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
        `wss://ropsten.infura.io/ws/v3/${process.env.INFURA_PROJECT_ID}`
      ),
      network_id: 3,                        // Ropsten's id
      gas: process.env.GAS_LIMIT,           // Ropsten has a lower block limit than mainnet 12,500,000. MAXIMUM Ropsten Block GAS_LIMIT = 8,000,000
      gasPrice: process.env.GAS_PRICE,      // Default gasPrice to send a transaction
      // confirmations: 2,                     // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,                   // # of blocks before a deployment times out  (minimum/default: 50)
      from: process.env.OPERATOR_ADDRESS,   // Send transactions from Operator Address
      skipDryRun: true,                     // Skip dry run before migrations? (default: false for public nets )
      websocket: true,
      networkCheckTimeout: 1800000
    },
     // Another network with more advanced options...
     // advanced: {
     // port: 8777,             // Custom port
     // network_id: 1342,       // Custom network
     // gas: 8500000,           // Gas sent with each transaction (default: ~6700000)
     // gasPrice: 20000000000,  // 20 gwei (in wei) (default: 100 gwei)
     // from: <address>,        // Account to send txs from (default: accounts[0])
     // websockets: true        // Enable EventEmitter interface for web3 (default: false)
     // },
     // Useful for deploying to a public network.
     // NB: It's important to wrap the provider as a function.
     ethereum: {
       provider: () => new HDWalletProvider( // Using MNEMONIC or PRIVATE_KEY
         // process.env.MNEMONIC,
         process.env.OPERATOR_PRIVATE_KEY,
         // `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
         `wss://mainnet.infura.io/ws/v3/${process.env.INFURA_PROJECT_ID}`
       ),
       network_id: 1,                        // Mainnet's id
       gas: process.env.GAS_LIMIT,           // Ropsten has a lower block limit than mainnet 12,500,000. MAXIMUM Ropsten Block GAS_LIMIT = 8,000,000
       gasPrice: process.env.GAS_PRICE,      // Default gasPrice to send a transaction
       confirmations: 2,                     // # of confs to wait between deployments. (default: 0)
       timeoutBlocks: 200,                   // # of blocks before a deployment times out  (minimum/default: 50)
       from: process.env.OPERATOR_ADDRESS,   // Send transactions from Operator Address
       skipDryRun: false,                      // Skip dry run before migrations? (default: false for public nets )
       websocket: true,
       networkCheckTimeout: 1800000
     },
     ropsten: {
       provider: () => new HDWalletProvider( // Using MNEMONIC or PRIVATE_KEY
         process.env.MNEMONIC,
        //  process.env.OPERATOR_PRIVATE_KEY,
         // `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
         `wss://ropsten.infura.io/ws/v3/${process.env.INFURA_PROJECT_ID}`
       ),
       network_id: 3,                        // Ropsten's id
       gas: process.env.GAS_LIMIT,           // Ropsten has a lower block limit than mainnet 12,500,000. MAXIMUM Ropsten Block GAS_LIMIT = 8,000,000
       gasPrice: process.env.GAS_PRICE,      // Default gasPrice to send a transaction
       // confirmations: 2,                     // # of confs to wait between deployments. (default: 0)
       timeoutBlocks: 200,                   // # of blocks before a deployment times out  (minimum/default: 50)
       from: process.env.OPERATOR_ADDRESS,   // Send transactions from Operator Address
       skipDryRun: true,                     // Skip dry run before migrations? (default: false for public nets )
       websocket: true,
       networkCheckTimeout: 1800000
     },
     rinkeby: {
       provider: () => new HDWalletProvider(
         // process.env.MNEMONIC,  // Using MNEMONIC or PRIVATE_KEY
         process.env.OPERATOR_PRIVATE_KEY,
         // `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
         `wss://rinkeby.infura.io/ws/v3/${process.env.INFURA_PROJECT_ID}`
       ),
       network_id: 4,                        // Rinkeby's id
       gas: process.env.GAS_LIMIT,           // Rinkeby has a lower block limit than mainnet 12,500,000. MAXIMUM Rinkeby Block GAS_LIMIT = 10,000,000
       gasPrice: process.env.GAS_PRICE,      // Default gasPrice to send a transaction
       // confirmations: 2,                     // # of confs to wait between deployments. (default: 0)
       timeoutBlocks: 200,                   // # of blocks before a deployment times out  (minimum/default: 50)
       from: process.env.OPERATOR_ADDRESS,   // Send transactions from Operator Address
       skipDryRun: true,                     // Skip dry run before migrations? (default: false for public nets )
       websocket: true,
       networkCheckTimeout: 1800000
     },
     bsc: {
       provider: () => new HDWalletProvider(
         //  process.env.MNEMONIC,  // Using MNEMONIC or PRIVATE_KEY
         process.env.OPERATOR_PRIVATE_KEY,
         `https://data-seed-prebsc-1-s3.binance.org:8545`
       ),
       network_id: 56,                       // BSC's id
       gas: process.env.GAS_LIMIT,           // BSC has a lower block limit than mainnet 12,500,000. MAXIMUM BSC Block GAS_LIMIT = 10,000,000
       gasPrice: process.env.GAS_PRICE,      // Default gasPrice to send a transaction
       confirmations: 2,                     // # of confs to wait between deployments. (default: 0)
       timeoutBlocks: 200,                   // # of blocks before a deployment times out  (minimum/default: 50)
       from: process.env.OPERATOR_ADDRESS,   // Send transactions from Operator Address
       skipDryRun: true                      // Skip dry run before migrations? (default: false for public nets )
     },
     bsc_testnet: {
       provider: () => new HDWalletProvider(
         //  process.env.MNEMONIC,  // Using MNEMONIC or PRIVATE_KEY
         process.env.OPERATOR_PRIVATE_KEY,
         `https://data-seed-prebsc-1-s3.binance.org:8545`
       ),
       network_id: 97,                       // BSC testnet's id
       gas: process.env.GAS_LIMIT,           // BSC testnet has a lower block limit than mainnet 12,500,000. MAXIMUM BSC testnet Block GAS_LIMIT = 10,000,000
       gasPrice: process.env.GAS_PRICE,      // Default gasPrice to send a transaction
       confirmations: 2,                     // # of confs to wait between deployments. (default: 0)
       timeoutBlocks: 200,                   // # of blocks before a deployment times out  (minimum/default: 50)
       from: process.env.OPERATOR_ADDRESS,   // Send transactions from Operator Address
       skipDryRun: true                      // Skip dry run before migrations? (default: false for public nets )
     },
     // Useful for private networks
     // private: {
     // provider: () => new HDWalletProvider(mnemonic, `https://network.io`),
     // network_id: 2111,   // This network is yours, in the cloud.
     // production: true    // Treats this network as if it was a public net. (default: false)
     // }
   },
 
   // Set default mocha options here, use special reporters etc.
   mocha: {
     // timeout: 100000
   },
 
   // Configure your compilers
   compilers: {
     solc: {
       version: "0.6.12",    // Fetch exact version from solc-bin (default: truffle's version)
       // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
       settings: {          // See the solidity docs for advice about optimization and evmVersion
         optimizer: {
           enabled: true,
           runs: 200
         },
         //  evmVersion: "byzantium"
       }
     }
   }
 };
 