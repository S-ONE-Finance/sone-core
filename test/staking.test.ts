/*
----------------------------------------
NOTE: 
- DEPLOY SONE TOKEN IN NETWORK `DEV`
- COPY ADDRESS SONE TOKEN TO ENV
- RUN TEST IN NETWORK `DEV`
----------------------------------------
*/
import BN from 'bn.js'
import {
  MockERC20Instance,
  SoneMasterFarmerInstance,
  SoneSwapRouterInstance,
  SoneTokenInstance,
  UniswapV2FactoryInstance,
  UniswapV2PairInstance,
  WETH9Instance,
} from '../types/truffle-contracts'
require('dotenv').config()
const { expectRevert } = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20')
const WETH = artifacts.require('WETH9')
const UniswapV2Factory = artifacts.require('UniswapV2Factory')
const UniswapV2Pair = artifacts.require('UniswapV2Pair')
const SoneSwapRouter = artifacts.require('SoneSwapRouter')
const SoneMasterFarmer = artifacts.require('SoneMasterFarmer')
const SoneToken = artifacts.require('SoneToken')
const revertMsg = require('./constants/error-msg.js').revertMsg
const _BN = (str: string | number) => new BN(str)

contract('staking', ([owner, alice, dev]) => {
  let _weth: WETH9Instance
  let _factory: UniswapV2FactoryInstance
  let _router: SoneSwapRouterInstance
  let _token0: MockERC20Instance
  let _token1: MockERC20Instance
  let _token2: MockERC20Instance
  let _pair: UniswapV2PairInstance
  let _pair1: UniswapV2PairInstance
  let _soneToken: SoneTokenInstance
  let _soneMasterFarmer: SoneMasterFarmerInstance

  beforeEach(async () => {
    // Initialize contract instances
    _weth = await WETH.new({ from: owner })
    _factory = await UniswapV2Factory.new(owner, { from: owner })
    _token0 = await MockERC20.new('TOKEN0', 'TOKEN0', '10000000', {
      from: alice,
    })
    _token1 = await MockERC20.new('TOKEN1', 'TOKEN1', '10000000', {
      from: alice,
    })
    _router = await SoneSwapRouter.new(_factory.address, _weth.address, {
      from: owner,
    })
    _pair = await UniswapV2Pair.at((await _factory.createPair(_token0.address, _token1.address)).logs[0].args.pair)
    _soneToken = await SoneToken.new(1, 1000, { from: owner })
    _soneMasterFarmer = await SoneMasterFarmer.new(_soneToken.address, dev, 5, 1, 720, { from: owner })
    const blkNumber = await web3.eth.getBlockNumber()
    await _soneToken.setAllowTransferOn(blkNumber + 1, { from: owner })
    _soneToken.transferOwnership(_soneMasterFarmer.address, { from: owner })
    // await _soneMasterFarmer.mintSoneToken(alice, 100, {from: owner});
    // const balance = await _soneToken.methods.balanceOf(alice).call({from: alice});
  })
  afterEach(async () => {
    await _soneMasterFarmer.transferOwnershipSoneToken(alice, {
      from: owner,
    })
  })

  describe('#add pool', async () => {
    it('success', async () => {
      // add new lp token to pool with allocation point
      await _soneMasterFarmer.add(10, _pair.address, true, {
        from: owner,
      })
      // check num of pool and total allocation point of all pools
      assert.equal((await _soneMasterFarmer.poolLength()).valueOf(), 1, 'soneMasterFarmer has 1 pool')
      assert.equal((await _soneMasterFarmer.totalAllocPoint()).valueOf(), 10, 'soneMasterFarmer has total 10 alloc points')
      // check first pool info
      const pool1 = await _soneMasterFarmer.poolInfo(0)
      assert.equal(pool1[0], _pair.address)
      assert.equal(pool1[1].toNumber(), 10)
    })
    // expect msg inform not have right to add token to pool
    it('exception not owner', async () => {
      await expectRevert(_soneMasterFarmer.add(10, _pair.address, true, { from: alice }), revertMsg.NOT_OWNER)
    })
    // expect msg for adding existed pool
    it('exception pool already exist', async () => {
      await _soneMasterFarmer.add(10, _pair.address, true, {
        from: owner,
      })
      await expectRevert(_soneMasterFarmer.add(10, _pair.address, true, { from: owner }), revertMsg.POOL_ALREADY_EXIT)
    })
  })
  describe('#update pool', async () => {
    beforeEach(async () => {
      await _soneMasterFarmer.add(10, _pair.address, true, {
        from: owner,
      })
    })
    it('success', async () => {
      // update first pool
      await _soneMasterFarmer.set(0, 20, true, { from: owner })
      // check num of pool and total alloc point after update for masterfarmer
      assert.equal((await _soneMasterFarmer.poolLength()).valueOf(), 1, 'soneMasterFarmer has 1 pool')
      assert.equal((await _soneMasterFarmer.totalAllocPoint()).valueOf(), 20, 'soneMasterFarmer has total 20 alloc points')
      // check pool0 info
      const pool1 = await _soneMasterFarmer.poolInfo(0)
      assert.equal(pool1[0], _pair.address)
      assert.equal(pool1[1].toNumber(), 20)
    })
    // check update first pool not by the owner
    it('exception not owner', async () => {
      await expectRevert(_soneMasterFarmer.set(0, 10, true, { from: alice }), revertMsg.NOT_OWNER)
    })
  })
  describe('#deposit', async () => {
    beforeEach(async () => {
      // add new pair to pool
      await _soneMasterFarmer.add(10, _pair.address, true, {
        from: owner,
      })
      // Approve allowance to spend alice's tokens for the _router
      await _token0.approve(_router.address, 10000000, { from: alice })
      await _token1.approve(_router.address, 10000000, { from: alice })
      // add liquidity
      await _router.addLiquidity(_token0.address, _token1.address, 1000000, 1000000, 0, 0, alice, 11571287987, { from: alice })
      await _router.addLiquidity(_token0.address, _token1.address, 1000000, 1000000, 0, 0, alice, 11571287987, { from: alice })
    })
    it('success', async () => {
      // get sone balance at addresses
      const balanceDevBefore = await _soneToken.balanceOf(dev)
      const balanceSoneTokenBefore = await _soneToken.balanceOf(_soneToken.address)
      const balanceSoneAliceBefore = await _soneToken.balanceOf(alice)
      // Approve allowance to spend alice's lp token for the _soneMasterFarmer
      await _pair.approve(_soneMasterFarmer.address, 10000000, {
        from: alice,
      })
      // deposit lp token from alice
      await _soneMasterFarmer.deposit(0, 999000, { from: alice })
      await _soneMasterFarmer.deposit(0, 1000000, { from: alice })
      // get sone balance at addresses after deposits
      const balanceDevAfter = await _soneToken.balanceOf(dev)
      const balanceSoneTokenAfter = await _soneToken.balanceOf(_soneToken.address)
      const balanceSoneAliceAfter = await _soneToken.balanceOf(alice)
      // check amount reward to dev
      assert.equal(balanceDevAfter.sub(balanceDevBefore).toNumber(), 4, 'sone reward to dev equal to 4') // 25% * 16
      // check sone balance
      assert.equal(balanceSoneTokenAfter.sub(balanceSoneTokenBefore).toNumber(), 131, 'sone balance equal to 131') // 75% * 16 + 75% * 159
      // check alice sone balance
      assert.equal(balanceSoneAliceAfter.sub(balanceSoneAliceBefore).toNumber(), 40, 'alice sone balance equal to 40') // 159 - 75%*159
      // check lp token deposit to farmer
      assert.equal((await _pair.balanceOf(_soneMasterFarmer.address)).toNumber(), 1999000)
      // get alice info in pool 0
      const userInfo = await _soneMasterFarmer.userInfo(0, alice)
      // check alice info (amount lp token alice provide and lp token alice has left)
      assert.equal(userInfo[0].toNumber(), 1999000)
      assert.equal((await _pair.balanceOf(alice)).toNumber(), 0)
    })
    // check deposit invalid amount(0)
    it('invalid amount', async () => {
      await expectRevert(_soneMasterFarmer.deposit(0, 0, { from: alice }), revertMsg.INVALID_AMOUNT_DEPOSIT)
    })
  })
  describe('#withdraw', async () => {
    beforeEach(async () => {
      // add new pair to pool
      await _soneMasterFarmer.add(10, _pair.address, true, {
        from: owner,
      })
      // Approve allowance to spend alice's tokens for the _router
      await _token0.approve(_router.address, 10000000, { from: alice })
      await _token1.approve(_router.address, 10000000, { from: alice })
      // add liquidity
      await _router.addLiquidity(_token0.address, _token1.address, 1000000, 1000000, 0, 0, alice, 11571287987, { from: alice })
      // Approve allowance to spend alice's lp token for the _soneMasterFarmer
      await _pair.approve(_soneMasterFarmer.address, 10000000, {
        from: alice,
      })
      // deposit lp token from alice
      await _soneMasterFarmer.deposit(0, 999000, { from: alice })
    })
    it('success', async () => {
      // get sone balance at addresses
      const balanceDevBefore = await _soneToken.balanceOf(dev)
      const balanceSoneTokenBefore = await _soneToken.balanceOf(_soneToken.address)
      const balanceSoneAliceBefore = await _soneToken.balanceOf(alice)
      // withdraw all lp tokens
      await _soneMasterFarmer.withdraw(0, 999000, { from: alice })
      // get sone balance at addresses
      const balanceDevAfter = await _soneToken.balanceOf(dev)
      const balanceSoneTokenAfter = await _soneToken.balanceOf(_soneToken.address)
      const balanceSoneAliceAfter = await _soneToken.balanceOf(alice)
      // check amount reward to dev
      assert.equal(balanceDevAfter.sub(balanceDevBefore).toNumber(), 4, 'sone reward to dev equal to 4') // 25% * 16
      // check sone balance
      assert.equal(balanceSoneTokenAfter.sub(balanceSoneTokenBefore).toNumber(), 131, 'sone balance equal to 131') // 75% * 16 + 75% * 159
      // check alice sone balance
      assert.equal(balanceSoneAliceAfter.sub(balanceSoneAliceBefore).toNumber(), 40, 'alice sone balance equal to 40') // 159 - 75%*159
      assert.equal((await _pair.balanceOf(_soneMasterFarmer.address)).toNumber(), 0, 'soneMasterFarmer has no lp tokens')
      // get alice info in pool 0
      const userInfo = await _soneMasterFarmer.userInfo(0, alice)
      // check lp token amount alice provides
      assert.equal(userInfo[0].valueOf(), 0)
      // check alice lp token balance
      assert.equal((await _pair.balanceOf(alice)).toNumber(), 999000)
    })
    // check withdraw amount larger than amount alice provides
    it('invalid amount', async () => {
      await expectRevert(_soneMasterFarmer.withdraw(0, 1000000, { from: alice }), revertMsg.INVALID_AMOUNT_WITHDRAW)
    })
  })
  describe('#update pool', async () => {
    beforeEach(async () => {
      // add new lp token to pool
      await _soneMasterFarmer.add(10, _pair.address, true, {
        from: owner,
      })
      // Approve allowance to spend alice's tokens for the _router
      await _token0.approve(_router.address, 10000000, { from: alice })
      await _token1.approve(_router.address, 10000000, { from: alice })
      // add liquidity
      await _router.addLiquidity(_token0.address, _token1.address, 1000000, 1000000, 0, 0, alice, 11571287987, { from: alice })
      // Approve allowance to spend alice's lp token for the _soneMasterFarmer
      await _pair.approve(_soneMasterFarmer.address, 10000000, {
        from: alice,
      })
      // alice deposits lp tokens
      await _soneMasterFarmer.deposit(0, 999000, { from: alice })
    })
    it('success', async () => {
      // get balance sone token of addresses
      const balanceDevBefore = await _soneToken.balanceOf(dev)
      const balanceSoneTokenBefore = await _soneToken.balanceOf(_soneToken.address)
      const balanceSoneAliceBefore = await _soneToken.balanceOf(alice)
      await _soneMasterFarmer.updatePool(0, { from: alice })
      // get balance sone token after update pool
      const balanceDevAfter = await _soneToken.balanceOf(dev)
      const balanceSoneTokenAfter = await _soneToken.balanceOf(_soneToken.address)
      const balanceSoneAliceAfter = await _soneToken.balanceOf(alice)
      // check amount reward to dev
      assert.equal(balanceDevAfter.sub(balanceDevBefore).toNumber(), 4, 'amount reward to dev equal to 4') // 25% * 16
      // check sone token balance
      assert.equal(balanceSoneTokenAfter.sub(balanceSoneTokenBefore).toNumber(), 12, 'sone balance equal to 12') // 75% * 16
      // check alice sone token balance
      assert.equal(balanceSoneAliceAfter.sub(balanceSoneAliceBefore).toNumber(), 0, 'alice has no sone token')
      const poolInfo = await _soneMasterFarmer.poolInfo(0)
      // check accSonePerShare
      assert.equal(poolInfo[3].valueOf(), 160160160) // 0 + (160 * 10^12) / 999000
      // check lastRewardBlock
      assert.equal(poolInfo[2].valueOf(), await web3.eth.getBlockNumber())
    })
  })
  describe('#get multiplier', async () => {
    it('_from < START_BLOCK', async () => {
      // START_BLOCK = 1
      const result = await _soneMasterFarmer.getMultiplier(0, 1)
      assert.equal(result.valueOf(), 0, 'reward multiplier equal to 0')
    })
    it('START_BLOCK < _from when week 1', async () => {
      const result = await _soneMasterFarmer.getMultiplier(1, 30)
      assert.equal(result.valueOf(), 928, 'reward multiplier equal to 928') // 29 * 32
    })
    it('START_BLOCK < _from when week 1 & 2', async () => {
      const result = await _soneMasterFarmer.getMultiplier(500, 800)
      assert.equal(result.valueOf(), 9600, 'reward multiplier equal to 9600') // (721−500)×32 + (800−721)×32
    })
  })

  describe('#get Pool Reward', async () => {
    beforeEach(async () => {
      // create new token
      _token2 = await MockERC20.new('TOKEN2', 'TOKEN2', '10000000', {
        from: alice,
      })
      _pair1 = await UniswapV2Pair.at((await _factory.createPair(_token0.address, _token2.address)).logs[0].args.pair)
      // add 2 lp tokens to pool
      await _soneMasterFarmer.add(10, _pair.address, true, {
        from: owner,
      })
      await _soneMasterFarmer.add(10, _pair1.address, true, {
        from: owner,
      })
    })
    it('success', async () => {
      const result = await _soneMasterFarmer.getPoolReward(1, 30, 10, {
        from: alice,
      })
      // check pool reward for farmer with totalAllocPoint = 20
      assert.equal(result[1].valueOf(), 2320) // ((30-1)*32*10)/20
      // check pool reward for dev
      assert.equal(result[0].valueOf(), 232) // 10% * forFarmer
    })
  })
  describe('#get Pending Reward', async () => {
    beforeEach(async () => {
      // Approve allowance to spend alice's tokens for the _router
      await _token0.approve(_router.address, 10000000, { from: alice })
      await _token1.approve(_router.address, 10000000, { from: alice })
      // add liquidity
      await _router.addLiquidity(_token0.address, _token1.address, 1000000, 1000000, 0, 0, alice, 11571287987, { from: alice })
      // add new lp token to pool
      await _soneMasterFarmer.add(10, _pair.address, true, {
        from: owner,
      })
      // Approve allowance to spend alice's lp token for the _soneMasterFarmer
      await _pair.approve(_soneMasterFarmer.address, 10000000, {
        from: alice,
      })
      // alice deposits lp tokens to pool
      await _soneMasterFarmer.deposit(0, 999000, { from: alice })
    })
    it('no pending', async () => {
      const result = await _soneMasterFarmer.pendingReward(0, alice, {
        from: alice,
      })
      assert.equal(result.valueOf(), 0) // no new block
    })
    it('exits pending', async () => {
      // update lastRewardBlock and accSonePerShare
      await _soneMasterFarmer.updatePool(0, { from: alice })
      const result = await _soneMasterFarmer.pendingReward(0, alice, {
        from: alice,
      })
      // check amount pending reward
      assert.equal(result.valueOf(), 159, 'alice pending reward equal to 159') // has 1 new block
    })
  })
  describe('#claim reward', async () => {
    beforeEach(async () => {
      // add new lp token to pool
      await _soneMasterFarmer.add(10, _pair.address, true, {
        from: owner,
      })
      // Approve allowance to spend alice's tokens for the _router
      await _token0.approve(_router.address, 10000000, { from: alice })
      await _token1.approve(_router.address, 10000000, { from: alice })
      // add liquidity
      await _router.addLiquidity(_token0.address, _token1.address, 1000000, 1000000, 0, 0, alice, 11571287987, { from: alice })
      // Approve allowance to spend alice's lp token for the _soneMasterFarmer
      await _pair.approve(_soneMasterFarmer.address, 10000000, {
        from: alice,
      })
      // alice deposits lp token to pool
      await _soneMasterFarmer.deposit(0, 999000, { from: alice })
    })
    it('success', async () => {
      // get sone token balance for addresses
      const balanceDevBefore = await _soneToken.balanceOf(dev)
      const balanceSoneTokenBefore = await _soneToken.balanceOf(_soneToken.address)
      const balanceSoneAliceBefore = await _soneToken.balanceOf(alice)
      // alice claim reward for staking
      await _soneMasterFarmer.claimReward(0, { from: alice })
      // get sone token balance for addresses after claimed
      const balanceDevAfter = await _soneToken.balanceOf(dev)
      const balanceSoneTokenAfter = await _soneToken.balanceOf(_soneToken.address)
      const balanceSoneAliceAfter = await _soneToken.balanceOf(alice)
      // check amount reward to dev
      assert.equal(balanceDevAfter.sub(balanceDevBefore).toNumber(), 4) // 25% * 16
      // check balance sone token
      assert.equal(balanceSoneTokenAfter.sub(balanceSoneTokenBefore).toNumber(), 131) // 75% * 16 + 75% * 159
      // check alice sone balance
      assert.equal(balanceSoneAliceAfter.sub(balanceSoneAliceBefore).toNumber(), 40) // 159 - 75%*159
      // check amount lp token in masterfarmer
      assert.equal((await _pair.balanceOf(_soneMasterFarmer.address)).toNumber(), 999000)
      // get alice info in pool
      const userInfo = await _soneMasterFarmer.userInfo(0, alice)
      // check amount lp token alice provides
      assert.equal(userInfo[0].valueOf(), 999000)
      // check amount alice lp token has
      assert.equal((await _pair.balanceOf(alice)).toNumber(), 0)
    })
  })

  describe('#emergency Withdraw', async () => {
    beforeEach(async () => {
      // add new pair to pool
      await _soneMasterFarmer.add(10, _pair.address, true, {
        from: owner,
      })
      // Approve allowance to spend alice's tokens for the _router
      await _token0.approve(_router.address, 10000000, { from: alice })
      await _token1.approve(_router.address, 10000000, { from: alice })
      // add liquidity
      await _router.addLiquidity(_token0.address, _token1.address, 1000000, 1000000, 0, 0, alice, 11571287987, { from: alice })
      // Approve allowance to spend alice's lp token for the _soneMasterFarmer
      await _pair.approve(_soneMasterFarmer.address, 10000000, {
        from: alice,
      })
      // deposit lp token to pool
      await _soneMasterFarmer.deposit(0, 999000, { from: alice })
    })
    it('success', async () => {
      // withdraw without rewards
      await _soneMasterFarmer.emergencyWithdraw(0, { from: alice })
      // check num lp token in pool and alice lp token balance
      assert.equal((await _pair.balanceOf(_soneMasterFarmer.address)).toNumber(), 0, 'soneMasterFarmer has no lp tokens')
      assert.equal((await _pair.balanceOf(alice)).toNumber(), 999000, 'alice lp token balance equal to 999000')
      // get alice info in pool
      const userInfo = await _soneMasterFarmer.userInfo(0, alice)
      // check amount lp token alice provides in pool
      assert.equal(userInfo[0].valueOf(), 0, 'amount lp token alice provides equal to 0')
      // check reward alice had received
      assert.equal(userInfo[1].valueOf(), 0, 'alice had received no rewards')
    })
  })
  describe('#set dev', async () => {
    it('success', async () => {
      // update dev address by previous dev address
      await _soneMasterFarmer.dev(alice, { from: dev })
      // check current dev address
      assert.equal(await _soneMasterFarmer.devaddr(), alice)
    })
    // check set dev address not by current dev address
    it('not dev address', async () => {
      await expectRevert(_soneMasterFarmer.dev(alice, { from: alice }), revertMsg.NOT_DEV_ADDRESS)
    })
  })
  describe('#getNewRewardPerBlock', async () => {
    beforeEach(async () => {
      // add new pair to pool
      await _soneMasterFarmer.add(10, _pair.address, true, {
        from: owner,
      })
    })
    // check reward for pool 0
    it('pid1 = 0', async () => {
      const result = await _soneMasterFarmer.getNewRewardPerBlock(0, {
        from: alice,
      })
      assert.equal(result.valueOf(), 160) // 32 * 5
    })
    // check reward for pool 1
    it('pid1 = 1', async () => {
      const result = await _soneMasterFarmer.getNewRewardPerBlock(1, {
        from: alice,
      })
      assert.equal(result.valueOf(), 160) // 32 * 5 * 10 (allocPoint) / 10 (totalAllocPoint)
    })
  })
})
