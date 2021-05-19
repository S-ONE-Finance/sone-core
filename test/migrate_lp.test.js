require('dotenv').config();
const reasonRevert = require("../constants/exceptions.js").reasonRevert;
const { expectRevert } = require('@openzeppelin/test-helpers');
const UniswapV2Factory = artifacts.require('UniswapV2Factory')
const UniswapV2Pair = artifacts.require('UniswapV2Pair')
const WETH = artifacts.require('WETH9')
const SoneSwapRouter = artifacts.require('SoneSwapRouter')
const SoneMasterFarmer = artifacts.require('SoneMasterFarmer')
const MockERC20 = artifacts.require('MockERC20')
const Migrator = artifacts.require('Migrator')
const BigNumber = require('bn.js')
var BN = (s) => new BigNumber(s.toString(), 10)

contract('staking', ([alice, dev, owner]) => {
  beforeEach(async () => {
    this.factory = await UniswapV2Factory.new(owner, { from: owner })
    this.token0 = await MockERC20.new('TOKEN0', 'TOKEN0', '10000000', { from: alice })
    this.token1 = await MockERC20.new('TOKEN1', 'TOKEN1', '10000000', { from: alice })
    this.weth = await WETH.new({ from: owner })
    this.router = await SoneSwapRouter.new(this.factory.address, this.weth.address, { from: owner })
    this.pair = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.token1.address)).logs[0].args.pair)
    this.soneMasterFarmer = await SoneMasterFarmer.new(process.env.SONE_ADDRESS, dev, 5, 1, 720, {from: owner})

    this.factoryNew = await UniswapV2Factory.new(owner, { from: owner })
    this.migrator = await Migrator.new(
      this.soneMasterFarmer.address,
      this.factory.address,
      this.factoryNew.address,
      2,
      { from: owner }
    )
  })
  describe('#check address migrator', async () => {
    it('not set', async () => {
      const migrator = await this.soneMasterFarmer.migrator()
      assert.equal(migrator, "0x0000000000000000000000000000000000000000")
    })
  })
  describe('#check set migrator', async () => {
    it('success', async () => {
      await this.soneMasterFarmer.setMigrator(this.migrator.address, {from: owner})
      const migrator = await this.soneMasterFarmer.migrator()
      assert.equal(migrator, this.migrator.address)
    })
    it('exception not owner', async () => {
      await expectRevert(this.soneMasterFarmer.setMigrator(this.migrator.address, {from: alice}), reasonRevert.NOT_OWNER)
    })
    // migrate
   
  })
  describe('#migrate', async () => {
    beforeEach(async () => {
      await this.soneMasterFarmer.add(
        10,
        this.pair.address,
        true,
        {from: owner}
      )
      await this.token0.approve(this.router.address, 10000000, { from: alice })
      await this.token1.approve(this.router.address, 10000000, { from: alice })
      await this.router.addLiquidity(
        this.token0.address,
        this.token1.address,
        1000000,
        1000000,
        0,
        0,
        alice,
        11571287987,
        { from: alice }
      )
      await this.pair.approve(this.soneMasterFarmer.address, 10000000, {from: alice})
      await this.soneMasterFarmer.deposit(
        0,
        999000,
        {from: alice}
      )
    })
    it('exception already set', async () => {
      await expectRevert(this.soneMasterFarmer.migrate(0, {from: owner}), reasonRevert.NOT_EXIST_MIGRATOR)
    })
    it('exception migrate bad', async () => {
      await this.soneMasterFarmer.setMigrator(this.migrator.address, {from: owner})
      await expectRevert(this.soneMasterFarmer.migrate(0, {from: owner}), reasonRevert.MIGRATE_BAD)
    })
    it('success', async () => {
      await this.soneMasterFarmer.setMigrator(this.migrator.address, {from: owner})
      await this.factoryNew.setMigrator(this.migrator.address, {from: owner})
      await this.soneMasterFarmer.migrate(0, {from: owner})
      const pairAddress = await this.factoryNew.getPair(this.token0.address, this.token1.address)
      this.pairNew = await UniswapV2Pair.at(pairAddress)
      assert.equal((await this.pairNew.balanceOf(this.soneMasterFarmer.address)).valueOf(), 999000)
      assert.equal((await this.pair.balanceOf(this.soneMasterFarmer.address)).valueOf(), 0)
    })
  })
})