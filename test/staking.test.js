require('dotenv').config();
const reasonRevert = require("../helpers/exceptions.js").reasonRevert;
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

const MINIMUM_LIQUIDITY = 1000

function getAmountOut(amountIn, reserveIn, reserveOut, swapFee) {
  var amountInWithFee = amountIn.mul(BN(1000).sub(swapFee))
  var numerator = amountInWithFee.mul(reserveOut)
  var denominator = reserveIn.mul(BN(1000)).add(amountInWithFee)
  return numerator.div(denominator)
}

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
    await this.soneToken.methods.transferOwnership(bob).call({from: alice})
  })

  describe('#add pool', async () => {
    it('success', async () => {
        // await this.soneMasterFarmer.add(
        //     10,
        //     this.pair.address,
        //     true,
        //     {from: owner}
        // );
        console.log('this.soneMasterFarmer.address', this.soneMasterFarmer.address)
        const aaa = await this.soneToken.methods.owner().call()
        console.log('aaa', aaa)
        // const bool = await this.soneMasterFarmer.testMint(alice, 100, {from: owner});
        // const balance = await this.soneToken.methods.balanceOf(alice).call({from: alice});
        // console.log('bool', bool);
        // console.log('balance', balance);
    //   await this.token0.approve(this.router.address, 1000000, { from: alice })
    //   await this.token1.approve(this.router.address, 1000000, { from: alice })
    //   await this.router.addLiquidity(
    //     this.token0.address,
    //     this.token1.address,
    //     1000000,
    //     1000000,
    //     0,
    //     0,
    //     alice,
    //     11571287987,
    //     { from: alice }
    //   )
    //   assert.equal((await this.pair.totalSupply()).valueOf(), 1000000)
    //   assert.equal((await this.pair.balanceOf(alice)).valueOf(), 1000000 - MINIMUM_LIQUIDITY)
    //   const reserves = await this.pair.getReserves()
    //   assert.equal(reserves[0].valueOf(), 1000000)
    //   assert.equal(reserves[1].valueOf(), 1000000)
    })
  });
})