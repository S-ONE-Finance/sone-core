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

contract('staking', ([alice, bob, owner]) => {
  beforeEach(async () => {
    this.factory = await UniswapV2Factory.new(owner, { from: owner })
    this.token0 = await MockERC20.new('TOKEN0', 'TOKEN0', '10000000', { from: alice })
    this.token1 = await MockERC20.new('TOKEN1', 'TOKEN1', '10000000', { from: alice })
    this.weth = await WETH.new({ from: owner })
    this.router = await SoneSwapRouter.new(this.factory.address, this.weth.address, { from: owner })
    this.pair = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.token1.address)).logs[0].args.pair)
    this.soneToken = await new web3.eth.Contract(SoneTokenInferface.abi, process.env.SONE_ADDRESS)
    this.soneMasterFarmer = await SoneMasterFarmer.new(process.env.SONE_ADDRESS, bob, 10, 1, 720, {from: owner})
    this.swapFee = await this.factory.swapFee()
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
      await this.token0.approve(this.router.address, 1000000, { from: alice })
      await this.token1.approve(this.router.address, 1000000, { from: alice })
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
      await this.pair.approve(this.soneMasterFarmer.address, 999000)
      await this.soneMasterFarmer.deposit(
        0,
        999000,
        {from: alice}
      )

    })
  });
})