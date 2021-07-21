import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import { HardhatUserConfig } from 'hardhat/config'
import dotenv from 'dotenv'
import 'tsconfig-paths/register' // This adds support for typescript paths mappings

import './src/tasks'

dotenv.config()

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  // Your type-safe config goes here
  defaultNetwork: 'private',
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
    },
    localhost: {
      url: `http://localhost:8545`,
      allowUnlimitedContractSize: false,
    },
    private: {
      url: `https://ganache.s-one.finance`,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: ['4c54f0453dc294005ba7c38944e84074c9e69399d06f8f60109de627fc678fdd'],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: ['4c54f0453dc294005ba7c38944e84074c9e69399d06f8f60109de627fc678fdd'],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.4.17',
      },
      {
        version: '0.5.16',
      },
      {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: '0.8.0',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  typechain: {
    outDir: 'src/types',
    target: 'ethers-v5',
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    // externalArtifacts: ['externalArtifacts/*.json'], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
  },
  paths: {
    root: './src',
    cache: '../cache',
    artifacts: '../artifacts',
  },
}

export default config
