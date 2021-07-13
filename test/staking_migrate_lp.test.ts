require('dotenv').config()
import {
  MigratorInstance,
  MockERC20Instance,
  SoneMasterFarmerInstance,
  SoneSwapRouterInstance,
  SoneTokenInstance,
  UniswapV2FactoryInstance,
  UniswapV2PairInstance,
  WETH9Instance,
} from '../types/truffle-contracts'
const { expectRevert } = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20')
const WETH = artifacts.require('WETH9')
const UniswapV2Factory = artifacts.require('UniswapV2Factory')
const UniswapV2Pair = artifacts.require('UniswapV2Pair')
const Migrator = artifacts.require('Migrator')
const SoneToken = artifacts.require('SoneToken')
const SoneSwapRouter = artifacts.require('SoneSwapRouter')
const SoneMasterFarmer = artifacts.require('SoneMasterFarmer')

const revertMsg = require('./constants/error-msg.js').revertMsg

contract('staking', ([alice, dev, owner]) => {
  let _weth: WETH9Instance
  let _factory: UniswapV2FactoryInstance
  let _router: SoneSwapRouterInstance
  let _token0: MockERC20Instance
  let _token1: MockERC20Instance
  let _pair: UniswapV2PairInstance
  let _soneMasterFarmer: SoneMasterFarmerInstance
  let _factoryNew: UniswapV2FactoryInstance
  let _migrator: MigratorInstance
  let _soneToken: SoneTokenInstance

  beforeEach(async () => {
    // Initialize contract instances
    _factory = await UniswapV2Factory.new(owner, { from: owner })
    _token0 = await MockERC20.new('TOKEN0', 'TOKEN0', '10000000', {
      from: alice,
    })
    _token1 = await MockERC20.new('TOKEN1', 'TOKEN1', '10000000', {
      from: alice,
    })
    _weth = await WETH.new({ from: owner })
    _router = await SoneSwapRouter.new(_factory.address, _weth.address, {
      from: owner,
    })
    _pair = await UniswapV2Pair.at((await _factory.createPair(_token0.address, _token1.address)).logs[0].args.pair)
    _soneToken = await SoneToken.new(1, 1000, { from: owner })
    _soneMasterFarmer = await SoneMasterFarmer.new(_soneToken.address, dev, 5, 1, 720, { from: owner })

    _factoryNew = await UniswapV2Factory.new(owner, { from: owner })
    _migrator = await Migrator.new(_soneMasterFarmer.address, _factory.address, _factoryNew.address, 2, { from: owner })
  })
  describe('#check address migrator', async () => {
    it('not set', async () => {
      // check migrator address when haven't set migrator
      const migrator = await _soneMasterFarmer.migrator()
      assert.equal(migrator, '0x0000000000000000000000000000000000000000')
    })
  })
  describe('#check set migrator', async () => {
    it('success', async () => {
      await _soneMasterFarmer.setMigrator(_migrator.address, { from: owner })
      const migrator = await _soneMasterFarmer.migrator()
      // check migrator address
      assert.equal(migrator, _migrator.address)
    })
    it('exception not owner', async () => {
      // check owner of masterfarmer to set migrator
      await expectRevert(_soneMasterFarmer.setMigrator(_migrator.address, { from: alice }), revertMsg.NOT_OWNER)
    })
  })
  // migrate
  describe('#migrate', async () => {
    beforeEach(async () => {
      // add new lp to pool
      await _soneMasterFarmer.add(10, _pair.address, true, { from: owner })
      // Approve allowance to spend alice's tokens for the router
      await _token0.approve(_router.address, 10000000, { from: alice })
      await _token1.approve(_router.address, 10000000, { from: alice })
      // add liquidity to pool
      await _router.addLiquidity(_token0.address, _token1.address, 1000000, 1000000, 0, 0, alice, 11571287987, { from: alice })
      // Approve allowance to spend alice's old lp token for the router
      await _pair.approve(_soneMasterFarmer.address, 10000000, { from: alice })
      // deposit amount of lp token to farm
      await _soneMasterFarmer.deposit(0, 999000, { from: alice })
    })
    it('exception already set', async () => {
      await expectRevert(_soneMasterFarmer.migrate(0, { from: owner }), revertMsg.NOT_EXIST_MIGRATOR)
    })
    it('exception migrate bad', async () => {
      await _soneMasterFarmer.setMigrator(_migrator.address, { from: owner })
      await expectRevert(_soneMasterFarmer.migrate(0, { from: owner }), revertMsg.MIGRATE_BAD)
    })
    it('success', async () => {
      // set migrator for farmer by owner
      await _soneMasterFarmer.setMigrator(_migrator.address, { from: owner })
      // set migrator to new factory
      await _factoryNew.setMigrator(_migrator.address, { from: owner })
      // migrate pool 0
      await _soneMasterFarmer.migrate(0, { from: owner })
      // get address lp token from new factory
      const pairAddress = await _factoryNew.getPair(_token0.address, _token1.address)
      const _pairNew = await UniswapV2Pair.at(pairAddress)
      // check sone master farmer lp token balance
      assert.equal(
        (await _pairNew.balanceOf(_soneMasterFarmer.address)).valueOf(),
        999000,
        'soneMasterFarmer new lp token balance equal to 999000'
      )
      assert.equal((await _pair.balanceOf(_soneMasterFarmer.address)).valueOf(), 0, 'soneMasterFarmer old lp token balance equal to 0')
    })
  })
})
