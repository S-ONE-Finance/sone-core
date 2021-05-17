/*
----------------------------------------
NOTE: 
- DEPLOY SONE TOKEN IN NETWORK `DEV`
- COPY ADDRESS SONE TOKEN TO ENV
- RUN TEST IN NETWORK `DEV`
----------------------------------------
*/


require('dotenv').config();
const reasonRevert = require("../constants/exceptions.js").reasonRevert;
const { expectRevert } = require('@openzeppelin/test-helpers');
const UniswapV2Factory = artifacts.require('UniswapV2Factory')
const UniswapV2Pair = artifacts.require('UniswapV2Pair')
const WETH = artifacts.require('WETH9')
const SoneSwapRouter = artifacts.require('SoneSwapRouter')
const SoneMasterFarmer = artifacts.require('SoneMasterFarmer')
const SoneTokenInferface = require('../build/contracts/ISoneToken.json')
const MockERC20 = artifacts.require('MockERC20')
const BigNumber = require('bn.js')
var BN = (s) => new BigNumber(s.toString(), 10)

contract('staking', ([alice, dev, owner]) => {
  // set one time to test
  beforeEach(async () => {
    this.factory = await UniswapV2Factory.new(owner, { from: owner })
    this.token0 = await MockERC20.new('TOKEN0', 'TOKEN0', '10000000', { from: alice })
    this.token1 = await MockERC20.new('TOKEN1', 'TOKEN1', '10000000', { from: alice })
    this.weth = await WETH.new({ from: owner })
    this.router = await SoneSwapRouter.new(this.factory.address, this.weth.address, { from: owner })
    this.pair = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.token1.address)).logs[0].args.pair)
    this.soneToken = await new web3.eth.Contract(SoneTokenInferface.abi, process.env.SONE_ADDRESS)
    this.soneMasterFarmer = await SoneMasterFarmer.new(process.env.SONE_ADDRESS, dev, 5, 1, 720, {from: owner})
    this.swapFee = await this.factory.swapFee()
    const allowTransferOnDefault = 12743793;
    const allowTransferOnCurrent = await this.soneToken.methods.allowTransferOn().call();
    if(allowTransferOnDefault == allowTransferOnCurrent){
      const blockLastest = await web3.eth.getBlockNumber();
      await this.soneToken.methods.setAllowTransferOn(blockLastest+1).send({from: alice}) // test
    }
    await this.soneToken.methods.transferOwnership(this.soneMasterFarmer.address).send({from: alice})
    // await this.soneMasterFarmer.mintSoneToken(alice, 100, {from: owner});
    // const balance = await this.soneToken.methods.balanceOf(alice).call({from: alice});
  })
  afterEach(async() => {
    await this.soneMasterFarmer.transferOwnershipSoneToken(alice,{ from: owner })
  })

  describe('#add pool', async () => {
    it('success', async () => {
        await this.soneMasterFarmer.add(
            10,
            this.pair.address,
            true,
            {from: owner}
        )
        assert.equal((await this.soneMasterFarmer.poolLength()).valueOf(), 1)
        assert.equal((await this.soneMasterFarmer.totalAllocPoint()).valueOf(), 10)
        const pool1 = await this.soneMasterFarmer.poolInfo(0)
        assert.equal(pool1.lpToken, this.pair.address)
        assert.equal(pool1.allocPoint, 10)
    })
    it('exception not owner', async () => {
      await expectRevert(this.soneMasterFarmer.add(
        10,
        this.pair.address,
        true,
        {from: alice}
      ), reasonRevert.NOT_OWNER)
    })
    it('exception pool already exist', async () => {
      await this.soneMasterFarmer.add(
        10,
        this.pair.address,
        true,
        {from: owner}
    )
      await expectRevert(this.soneMasterFarmer.add(
        10,
        this.pair.address,
        true,
        {from: owner}
      ), reasonRevert.POOL_ALREADY_EXIT)
    })
  });
  describe('#update pool', async () => {
    beforeEach(async () => {
      await this.soneMasterFarmer.add(
        10,
        this.pair.address,
        true,
        {from: owner}
      )
    })
    it('success', async () => {
      await this.soneMasterFarmer.set(
        0,
        20,
        true,
        {from: owner}
      )
      assert.equal((await this.soneMasterFarmer.poolLength()).valueOf(), 1)
      assert.equal((await this.soneMasterFarmer.totalAllocPoint()).valueOf(), 20)
      const pool1 = await this.soneMasterFarmer.poolInfo(0)
      assert.equal(pool1.lpToken, this.pair.address)
      assert.equal(pool1.allocPoint, 20)
    })
    it('exception not owner', async () => {
      await expectRevert(this.soneMasterFarmer.set(
        0,
        10,
        true,
        {from: alice}
      ), reasonRevert.NOT_OWNER)
    })
  });
  describe('#deposit', async () => {
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
    })
    it('success', async () => {
      const balanceDevBefore = await this.soneToken.methods.balanceOf(dev).call({from: dev})
      const balanceSoneTokenBefore = await this.soneToken.methods.balanceOf(process.env.SONE_ADDRESS).call({from: alice})
      const balanceSoneAliceBefore = await this.soneToken.methods.balanceOf(alice).call({from: alice})
      await this.pair.approve(this.soneMasterFarmer.address, 10000000, {from: alice})
        await this.soneMasterFarmer.deposit(
          0,
          999000,
          {from: alice}
        )
      await this.soneMasterFarmer.deposit(
        0,
        1000000,
        {from: alice}
      )
      const balanceDevAfter = await this.soneToken.methods.balanceOf(dev).call({from: dev})
      const balanceSoneTokenAfter = await this.soneToken.methods.balanceOf(process.env.SONE_ADDRESS).call({from: alice})
      const balanceSoneAliceAfter = await this.soneToken.methods.balanceOf(alice).call({from: alice})
      assert.equal(balanceDevAfter-balanceDevBefore, 4) // 25% * 16
      assert.equal(balanceSoneTokenAfter-balanceSoneTokenBefore, 131) // 75% * 16 + 75% * 159
      assert.equal(balanceSoneAliceAfter-balanceSoneAliceBefore, 40) // 159 - 75%*159
      assert.equal(await this.pair.balanceOf(this.soneMasterFarmer.address).valueOf(), 1999000)
      const userInfo = await this.soneMasterFarmer.userInfo(0, alice);
      assert.equal(userInfo.amount.valueOf(), 1999000)
      assert.equal(await this.pair.balanceOf(alice).valueOf(), 0)

    })
    it('invalid amount', async () => {
      await expectRevert(this.soneMasterFarmer.deposit(
        0,
        0,
        {from: alice}
      ), reasonRevert.INVALID_AMOUNT_DEPOSIT)
    })
  });
  describe('#withdraw', async () => {
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
    it('success', async () => {
      const balanceDevBefore = await this.soneToken.methods.balanceOf(dev).call({from: dev})
      const balanceSoneTokenBefore = await this.soneToken.methods.balanceOf(process.env.SONE_ADDRESS).call({from: alice})
      const balanceSoneAliceBefore = await this.soneToken.methods.balanceOf(alice).call({from: alice})
      await this.soneMasterFarmer.withdraw(
        0,
        999000,
        {from: alice}
      )
      const balanceDevAfter = await this.soneToken.methods.balanceOf(dev).call({from: dev})
      const balanceSoneTokenAfter = await this.soneToken.methods.balanceOf(process.env.SONE_ADDRESS).call({from: alice})
      const balanceSoneAliceAfter = await this.soneToken.methods.balanceOf(alice).call({from: alice})
      assert.equal(balanceDevAfter-balanceDevBefore, 4) // 25% * 16
      assert.equal(balanceSoneTokenAfter-balanceSoneTokenBefore, 131) // 75% * 16 + 75% * 159
      assert.equal(balanceSoneAliceAfter-balanceSoneAliceBefore, 40) // 159 - 75%*159
      assert.equal(await this.pair.balanceOf(this.soneMasterFarmer.address).valueOf(), 0)
      const userInfo = await this.soneMasterFarmer.userInfo(0, alice);
      assert.equal(userInfo.amount.valueOf(), 0)
      assert.equal(await this.pair.balanceOf(alice).valueOf(), 999000)
    })
    it('invalid amount', async () => {
      await expectRevert(this.soneMasterFarmer.withdraw(
        0,
        1000000,
        {from: alice}
      ), reasonRevert.INVALID_AMOUNT_WITHDRAW)
    })
  })
  describe('#update pool', async () => {
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
    it('success', async () => {
      const balanceDevBefore = await this.soneToken.methods.balanceOf(dev).call({from: dev})
      const balanceSoneTokenBefore = await this.soneToken.methods.balanceOf(process.env.SONE_ADDRESS).call({from: alice})
      const balanceSoneAliceBefore = await this.soneToken.methods.balanceOf(alice).call({from: alice})
      await this.soneMasterFarmer.updatePool(
        0,
        {from: alice}
      )
      const balanceDevAfter = await this.soneToken.methods.balanceOf(dev).call({from: dev})
      const balanceSoneTokenAfter = await this.soneToken.methods.balanceOf(process.env.SONE_ADDRESS).call({from: alice})
      const balanceSoneAliceAfter = await this.soneToken.methods.balanceOf(alice).call({from: alice})
      assert.equal(balanceDevAfter-balanceDevBefore, 4) // 25% * 16
      assert.equal(balanceSoneTokenAfter-balanceSoneTokenBefore, 12) // 75% * 16
      assert.equal(balanceSoneAliceAfter-balanceSoneAliceBefore, 0)
      const poolInfo = await this.soneMasterFarmer.poolInfo(0);
      assert.equal(poolInfo.accSonePerShare.valueOf(), 160160160) // 0 + (160 * 10^12) / 999000
      assert.equal(poolInfo.lastRewardBlock.valueOf(), await web3.eth.getBlockNumber())
    })
  })
  describe('#get multiplier', async () => {
    it('_from < START_BLOCK', async () => {
      const result = await this.soneMasterFarmer.getMultiplier(0, 1)
      assert.equal(result.valueOf(), 0)
    })
    it('START_BLOCK < _from when week 1', async () => {
      const result = await this.soneMasterFarmer.getMultiplier(1, 30)
      assert.equal(result.valueOf(), 928) // 29 * 32
    })
    it('START_BLOCK < _from when week 1 & 2', async () => {
      const result = await this.soneMasterFarmer.getMultiplier(500, 800)
      assert.equal(result.valueOf(), 9600) // (721−500)×32 + (800−721)×32
    })
  })

  describe('#get Pool Reward', async () => {
    beforeEach(async () => {
      this.token2 = await MockERC20.new('TOKEN2', 'TOKEN2', '10000000', { from: alice })
      this.pair1 = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.token2.address)).logs[0].args.pair)
      await this.soneMasterFarmer.add(
        10,
        this.pair.address,
        true,
        {from: owner}
      )
      await this.soneMasterFarmer.add(
        10,
        this.pair1.address,
        true,
        {from: owner}
      )
    })
    it('success', async () => {
      const result = await this.soneMasterFarmer.getPoolReward(
        1,
        30,
        10,
        {from: alice}
      )
      assert.equal(result.forFarmer.valueOf(), 2320) // ((30-1)*32*10)/20
      assert.equal(result.forDev.valueOf(), 232) // 10% * forFarmer
    })
  })
  describe('#get Pending Reward', async () => {
    beforeEach(async () => {
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
      await this.soneMasterFarmer.add(
        10,
        this.pair.address,
        true,
        {from: owner}
      )
      await this.pair.approve(this.soneMasterFarmer.address, 10000000, {from: alice})
      await this.soneMasterFarmer.deposit(
        0,
        999000,
        {from: alice}
      )
      
    })
    it('no pending', async () => {
      const result = await this.soneMasterFarmer.pendingReward(
        0,
        alice,
        {from: alice}
      )
      assert.equal(result.valueOf(), 0) // no new block
    })
    it('exits pending', async () => {
      await this.soneMasterFarmer.updatePool(
        0,
        {from: alice}
      )
      const result = await this.soneMasterFarmer.pendingReward(
        0,
        alice,
        {from: alice}
      )
      assert.equal(result.valueOf(), 159) // has 1 new block
    })
  })
  describe('#claim reward', async () => {
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
    it('success', async () => {
      const balanceDevBefore = await this.soneToken.methods.balanceOf(dev).call({from: dev})
      const balanceSoneTokenBefore = await this.soneToken.methods.balanceOf(process.env.SONE_ADDRESS).call({from: alice})
      const balanceSoneAliceBefore = await this.soneToken.methods.balanceOf(alice).call({from: alice})
      await this.soneMasterFarmer.claimReward(
        0,
        {from: alice}
      )
      const balanceDevAfter = await this.soneToken.methods.balanceOf(dev).call({from: dev})
      const balanceSoneTokenAfter = await this.soneToken.methods.balanceOf(process.env.SONE_ADDRESS).call({from: alice})
      const balanceSoneAliceAfter = await this.soneToken.methods.balanceOf(alice).call({from: alice})
      assert.equal(balanceDevAfter-balanceDevBefore, 4) // 25% * 16
      assert.equal(balanceSoneTokenAfter-balanceSoneTokenBefore, 131) // 75% * 16 + 75% * 159
      assert.equal(balanceSoneAliceAfter-balanceSoneAliceBefore, 40) // 159 - 75%*159
      assert.equal(await this.pair.balanceOf(this.soneMasterFarmer.address).valueOf(), 999000)
      const userInfo = await this.soneMasterFarmer.userInfo(0, alice);
      assert.equal(userInfo.amount.valueOf(), 999000)
      assert.equal(await this.pair.balanceOf(alice).valueOf(), 0)
    })
  })

  describe('#emergency Withdraw', async () => {
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
    it('success', async () => {
      await this.soneMasterFarmer.emergencyWithdraw(
        0,
        {from: alice}
      )
      assert.equal(await this.pair.balanceOf(this.soneMasterFarmer.address).valueOf(), 0)
      assert.equal(await this.pair.balanceOf(alice).valueOf(), 999000)
      const userInfo = await this.soneMasterFarmer.userInfo(0, alice);
      assert.equal(userInfo.amount.valueOf(), 0)
      assert.equal(userInfo.rewardDebt.valueOf(), 0)
    })
  })
  describe('#set dev', async () => {
    it('success', async () => {
      await this.soneMasterFarmer.dev(
        alice,
        {from: dev}
      )
      assert.equal(await this.soneMasterFarmer.devaddr(), alice)
    })
    it('not dev address', async () => {
      await expectRevert(this.soneMasterFarmer.dev(
        alice,
        {from: alice}
      ), reasonRevert.NOT_DEV_ADDRESSS)
    })
  })
  describe('#getNewRewardPerBlock', async () => {
    beforeEach(async () => {
      await this.soneMasterFarmer.add(
        10,
        this.pair.address,
        true,
        {from: owner}
      )
    })
    it('pid1 = 0', async () => {
      const result = await this.soneMasterFarmer.getNewRewardPerBlock(
        0,
        {from: alice}
      )
      assert.equal(result.valueOf(), 160)  // 32 * 5
    })
    it('pid1 = 1', async () => {
      const result = await this.soneMasterFarmer.getNewRewardPerBlock(
        0,
        {from: alice}
      )
      assert.equal(result.valueOf(), 160)  // 32 * 5 * 10 (allocPoint) / 10 (totalAllocPoint)
    })
  })
})