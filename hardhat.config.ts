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
      url: `https://private-net.s-one.finance`,
      accounts: [
        process.env.PRIVATE_OPERATOR_PRIVATE_KEY as string,
        '0xcadbe0586fb7b800b1d94d5b5ca5c7765419adbad1f5a21c94f36023112b3e85',
        '0x9811566962d584d506458555d88616c7c3e8e0365332bd6a543f9c37209efa19',
      ],
      gasPrice: 'auto',
    },
    ganache: {
      url: `https://ganache.s-one.finance`,
      accounts: [
        '0x4b07975545d12e8c92baa5bde272e3504c37944f1385858e1cc8be62d97dec05',
        '0xcadbe0586fb7b800b1d94d5b5ca5c7765419adbad1f5a21c94f36023112b3e85',
        '0x9811566962d584d506458555d88616c7c3e8e0365332bd6a543f9c37209efa19',
      ],
      gasPrice: 'auto',
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
    alwaysGenerateOverloads: true, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    // externalArtifacts: ['externalArtifacts/*.json'], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
  },
  paths: {
    root: './src',
    cache: '../cache',
    artifacts: '../artifacts',
  },
}

export default config
