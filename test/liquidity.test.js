const UniswapV2Factory = artifacts.require('UniswapV2Factory')
const UniswapV2Pair = artifacts.require('UniswapV2Pair')
const WETH = artifacts.require('WETH9')
const UniswapV2Router02 = artifacts.require('UniswapV2Router02')
const SoneToken = artifacts.require('SoneToken')
const SoneConvert = artifacts.require('SoneConvert')
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

contract('liquidity', ([alice, bob, owner]) => {
  beforeEach(async () => {
    this.factory = await UniswapV2Factory.new(owner, { from: owner })
    this.token0 = await MockERC20.new('TOKEN0', 'TOKEN0', '10000000', { from: alice })
    this.token1 = await MockERC20.new('TOKEN1', 'TOKEN1', '10000000', { from: alice })
    this.weth = await WETH.new({ from: owner })
    this.router = await UniswapV2Router02.new(this.factory.address, this.weth.address, { from: owner })
    this.pair = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.token1.address)).logs[0].args.pair)
    this.soneToken = await SoneToken.new(1, 1000, {from: owner})
    this.soneConvert = await SoneConvert.new(this.soneToken.address, this.weth.address, this.factory.address, this.router.address, { from: owner })
    this.swapFee = await this.factory.swapFee()
  })

  // describe('#add liquidity', async () => {
  //   it('mint', async () => {
  //     await this.token0.transfer(this.pair.address, '1000000', { from: alice })
  //     await this.token1.transfer(this.pair.address, '1000000', { from: alice })
  //     await this.pair.mint(alice, { from: alice })
  
  //     assert.equal((await this.pair.totalSupply()).valueOf(), 1000000)
  //     assert.equal((await this.pair.balanceOf(alice)).valueOf(), 1000000 - MINIMUM_LIQUIDITY)
  //     const reserves = await this.pair.getReserves()
  //     assert.equal(reserves[0].valueOf(), 1000000)
  //     assert.equal(reserves[1].valueOf(), 1000000)
  //   })
  // });
  // describe('#withdraw liquidity', async () => {
  //   it('burn: without fee', async () => {
  //     await this.token0.transfer(this.pair.address, '1000000', { from: alice })
  //     await this.token1.transfer(this.pair.address, '1000000', { from: alice })
  //     await this.pair.mint(alice, { from: alice })
  
  //     await this.pair.transfer(this.pair.address, 1000000 - MINIMUM_LIQUIDITY, { from: alice})
  //     await this.pair.burn(alice, { from: alice })
  
  //     assert.equal((await this.pair.totalSupply()).valueOf(), MINIMUM_LIQUIDITY)
  //     assert.equal((await this.pair.balanceOf(alice)).valueOf(), 0)
  //     const reserves = await this.pair.getReserves()
  //     assert.equal(reserves[0].valueOf(), MINIMUM_LIQUIDITY)
  //     assert.equal(reserves[1].valueOf(), MINIMUM_LIQUIDITY)
  //   })
  
  //   it('burn: with fee', async () => {
  //     await this.factory.setWithdrawFeeTo(bob, { from: owner })
  
  //     await this.token0.transfer(this.pair.address, '1000000', { from: alice })
  //     await this.token1.transfer(this.pair.address, '1000000', { from: alice })
  //     await this.pair.mint(alice, { from: alice })
  
  //     await this.pair.transfer(this.pair.address, 1000000 - MINIMUM_LIQUIDITY, { from: alice})
  //     await this.pair.burn(alice, { from: alice })
  
  //     assert.equal((await this.pair.totalSupply()).valueOf(), MINIMUM_LIQUIDITY + 999)
  //     assert.equal((await this.pair.balanceOf(alice)).valueOf(), 0)
  //     assert.equal((await this.token0.balanceOf(alice)).valueOf(), 9998001)
  //     assert.equal((await this.token1.balanceOf(alice)).valueOf(), 9998001)
  //     assert.equal((await this.pair.balanceOf(bob)).valueOf(), 999)
  //     const reserves = await this.pair.getReserves()
  //     assert.equal(reserves[0].valueOf(), 1999)
  //     assert.equal(reserves[1].valueOf(), 1999)
  //   })
  // });
  describe('#withdraw liquidity with sone covert', async () => {
    beforeEach(async () => {
      await this.factory.setSoneConvert(this.soneConvert.address, { from: owner })
      await this.factory.setFeeTo(owner, { from: owner })
      await this.token0.mint(bob, 10000000)
      await this.token1.mint(bob, 10000000)
      // alice add liquidity
      await this.token0.transfer(this.pair.address, '1000000', { from: alice })
      await this.token1.transfer(this.pair.address, '1000000', { from: alice })
      await this.pair.mint(alice, { from: alice })
      // bob add liquidity
      await this.token0.transfer(this.pair.address, '1000000', { from: bob })
      await this.token1.transfer(this.pair.address, '1000000', { from: bob })
      await this.pair.mint(bob, { from: bob })

    })
    it('return 2 token from convert', async () => {
      // swap 
      for (let index = 1; index < 30; index++) {
        let reserveIn = await this.pair.getReserves();
        const amountOut = getAmountOut(BN(1000), reserveIn[0], reserveIn[1], BN(this.swapFee))
        await this.token0.transfer(this.pair.address, '1000', { from: alice })
        await this.pair.swap(0, amountOut, alice, '0x', { from: alice })
      }
      // remove liquidity
      let totalSupplyLiquid = (await this.pair.totalSupply()).valueOf()
      await this.pair.transfer(this.pair.address, '1000000', { from: bob}) 
      await this.pair.burn(bob, { from: bob })
      await this.soneConvert.convertToSone(
        this.token0.address,
        this.token1.address,
        '1000000',
        totalSupplyLiquid.toString(),
        bob,
        { from: bob }
      )

      assert.equal((await this.token0.balanceOf(bob)).valueOf(), 10014495) //  9000000 (balance) + 1014491 (remove liquid) + 4 (from convert)
      assert.equal((await this.token1.balanceOf(bob)).valueOf(), 9985753) // 9000000 (balance) + 985750 (remove liquid) + 3 (from convert)
    })

    it('return sone when exist 1 token can swap to SONE', async () => {
      // create pool token0-SONE
      this.pairToken0SONE = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.soneToken.address)).logs[0].args.pair)
      this.soneToken.mint( alice, 10000000, {from: owner})
      await this.token0.transfer(this.pairToken0SONE.address, '1000000', { from: alice })
      await this.soneToken.transfer(this.pairToken0SONE.address, '1000000', { from: alice })
      await this.pairToken0SONE.mint(alice, { from: alice })
      // swap 
      for (let index = 1; index < 30; index++) {
        let reserveIn = await this.pair.getReserves();
        const amountOut = getAmountOut(BN(1000), reserveIn[0], reserveIn[1], BN(this.swapFee))
        await this.token0.transfer(this.pair.address, '1000', { from: alice })
        await this.pair.swap(0, amountOut, alice, '0x', { from: alice })
      }
      // remove liquidity
      let totalSupplyLiquid = (await this.pair.totalSupply()).valueOf()
      await this.pair.transfer(this.pair.address, '1000000', { from: bob}) 
      await this.pair.burn(bob, { from: bob })
      await this.soneConvert.convertToSone(
        this.token0.address,
        this.token1.address,
        '1000000',
        totalSupplyLiquid.toString(),
        bob,
        { from: bob }
      )

      assert.equal((await this.token0.balanceOf(bob)).valueOf(), 10014491) //  9000000 (balance) + 1014491 (remove liquid)
      assert.equal((await this.token1.balanceOf(bob)).valueOf(), 9985750) // 9000000 (balance) + 985750 (remove liquid)

      assert.equal((await this.soneToken.balanceOf(bob)).valueOf(), 5) // 3 (covert from token0-sone) + 2 (covert from token1-token0-sone)
    })
  })
})