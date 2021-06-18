require('dotenv').config()
// const BigNumber = require('bn.js')
const { expectRevert } = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20')
const WETH = artifacts.require('WETH9')
const UniswapV2Factory = artifacts.require('UniswapV2Factory')
const UniswapV2Pair = artifacts.require('UniswapV2Pair')
const SoneSwapRouter = artifacts.require('SoneSwapRouter')
const SoneMasterFarmer = artifacts.require('SoneMasterFarmer')

const SoneTokenInferface = require('../../build/contracts/ISoneToken.json')
const { getPairAddress } = require('../lib/utils')

const FACTORY_ADDRESS = `0xF064608e98EEB7363E3ecC511Ca0ED09a3192c83`,
  ROUTER_ADDRESS = `0x4354DD6060C858dE7704D2f11EfC582c49A73889`,
  WETH_ADDRESS = `0xc778417E063141139Fce010982780140Aa0cD5Ab`,
  TOKEN0_ADDRESS = `0xAf85dD74317AE72674Bf77200D2ff3e80e85e375`,
  TOKEN1_ADDRESS = `0x38152Db641aF29Dd4712a6f062d1B993CF67Afef`,
  MASTER_FARMER_ADDRESS = `0x63F66ed3fC966350A656701c09e312010915E997`

contract('SoneMasterFarmer', ([alice, dev, owner]) => {

  describe('# Get contract info', async () => {
    it('info', async () => {
      this.weth = await new web3.eth.Contract(WETH.abi, WETH_ADDRESS)
      this.factory = await new web3.eth.Contract(UniswapV2Factory.abi, FACTORY_ADDRESS)
      this.token0 = await new web3.eth.Contract(MockERC20.abi, TOKEN0_ADDRESS)
      this.token1 = await new web3.eth.Contract(MockERC20.abi, TOKEN1_ADDRESS)
      this.router = await new web3.eth.Contract(SoneSwapRouter.abi, ROUTER_ADDRESS)
      this.pair = await new web3.eth.Contract(
        UniswapV2Pair.abi,
        await getPairAddress(this.factory, this.token0.options.address, this.token1.options.address)
      )
      this.soneToken = await new web3.eth.Contract(SoneTokenInferface.abi, process.env.SONE_ADDRESS)
      this.soneMasterFarmer = await new web3.eth.Contract(SoneMasterFarmer.abi, MASTER_FARMER_ADDRESS)

      this.swapFee = await this.factory.methods.swapFee().call()
      const allowTransferOnDefault = 12743793
      const allowTransferOnCurrent = await this.soneToken.methods.allowTransferOn().call()
      if (allowTransferOnDefault == allowTransferOnCurrent) {
        const blockLastest = await web3.eth.getBlockNumber()
        await this.soneToken.methods.setAllowTransferOn(blockLastest + 1).send({ from: alice })
      }

      const soneOwner = await this.soneToken.methods.owner().call()
      if (soneOwner != MASTER_FARMER_ADDRESS) {
        assert.equal(soneOwner, alice, `SONE token owner is not alice`)
        await this.soneToken.methods.transferOwnership(this.soneMasterFarmer.options.address).send({ from: alice })
      }
    })
  })
})