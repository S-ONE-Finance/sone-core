import BN from "bn.js"
import { MockERC20Instance, SoneConvertInstance, SoneSwapRouterInstance, SoneTokenInstance, UniswapV2FactoryInstance, UniswapV2PairInstance, WETH9Instance } from "../types/truffle-contracts"

const MockERC20 = artifacts.require('MockERC20')
const WETH = artifacts.require('WETH9')
const UniswapV2Factory = artifacts.require('UniswapV2Factory')
const UniswapV2Pair = artifacts.require('UniswapV2Pair')
const SoneToken = artifacts.require('SoneToken')
const SoneSwapRouter = artifacts.require('SoneSwapRouter')
const SoneConvert = artifacts.require('SoneConvert')

const MINIMUM_LIQUIDITY = 1000

contract('SoneSwapRouter - Add Liquidity', ([alice, bob, owner]) => {
  let weth: WETH9Instance
  let factory: UniswapV2FactoryInstance
  let router: SoneSwapRouterInstance
  let soneToken: SoneTokenInstance
  let soneConvert: SoneConvertInstance
  let token0: MockERC20Instance
  let token1: MockERC20Instance
  let pair: UniswapV2PairInstance


  beforeEach(async () => {
    // Initialize contract instances
    weth = await WETH.new({ from: owner })
    factory = await UniswapV2Factory.new(owner, { from: owner })
    router = await SoneSwapRouter.new(factory.address, weth.address, { from: owner })
    soneToken = await SoneToken.new({ from: owner })
    soneConvert = await SoneConvert.new(soneToken.address, weth.address, factory.address, router.address, { from: owner })
    token0 = await MockERC20.new('TOKEN0', 'TOKEN0', '50000000', { from: owner })
    token1 = await MockERC20.new('TOKEN1', 'TOKEN1', '50000000', { from: owner })

    // Transfer tokens to alice address
    await token0.transfer(alice, 1000000, { from: owner })
    await token1.transfer(alice, 1000000, { from: owner })

    // Appove allowance to spend alice's tokens for the router
    await token0.approve(router.address, 1000000, { from: alice })
    await token1.approve(router.address, 1000000, { from: alice })
  })

  describe('# add liquidity with 2 tokens', async () => {
    it('to a pool excluding ETH', async () => {
      pair = await UniswapV2Pair.at((await factory.createPair(token0.address, token1.address)).logs[0].args.pair)

      await router.addLiquidity(
        token0.address, token1.address, 1000000, 1000000, 0, 0, alice, 11571287987,
        { from: alice }
      )

      assert.equal((await pair.totalSupply()).toNumber(), 1000000)
      assert.equal((await pair.balanceOf(alice)).toNumber(), 1000000 - MINIMUM_LIQUIDITY)

      const reserves = await pair.getReserves()
      assert.equal(reserves[0].toNumber(), 1000000)
      assert.equal(reserves[1].toNumber(), 1000000)
    })

    it('to a pool including ETH', async () => {
      pair = await UniswapV2Pair.at((await factory.createPair(token0.address, weth.address)).logs[0].args.pair)

      const balanceBeforeAdd = await web3.eth.getBalance(alice)

      const txAddLiquidity = await router.addLiquidityETH(
        token0.address, 1000000, 0, 0, alice, 11571287987,
        {
          from: alice,
          value: "1000000"
        }
      )
      const tx = await web3.eth.getTransaction(txAddLiquidity.tx)
      const fee = txAddLiquidity.receipt.gasUsed * Number(tx.gasPrice)
      const balanceAfterAdd = await web3.eth.getBalance(alice)

      console.log(`gasPrice ->`, tx.gasPrice)
      console.log(`fee ->`, fee)
      console.log(`balanceBeforeAdd ->`, balanceBeforeAdd)
      console.log(`balanceAfterAdd ->`, balanceAfterAdd)

      const value = Number(balanceBeforeAdd) - Number(balanceAfterAdd) - fee
      assert.equal(value, 1000000)
      assert.equal((await pair.totalSupply()).toNumber(), 1000000)
      assert.equal((await pair.balanceOf(alice)).toNumber(), 1000000 - MINIMUM_LIQUIDITY)

      const reserves = await pair.getReserves()
      assert.equal(reserves[0].toNumber(), 1000000)
      assert.equal(reserves[1].toNumber(), 1000000)
    })
  })

  describe('# add liquidity with 1 token', async () => {
    beforeEach(async () => {
      // Appove allowance to spend bob's tokens for the router
      await token0.approve(router.address, 1000000, { from: bob })
      await token1.approve(router.address, 1000000, { from: bob })
    })

    it('to a pool excluding ETH', async () => {
      pair = await UniswapV2Pair.at((await factory.createPair(token0.address, token1.address)).logs[0].args.pair)

      await token0.transfer(bob, 10000000, { from: owner })
      await router.addLiquidity(
        token0.address, token1.address, 1000000, 1000000, 0, 0, alice, 11571287987,
        { from: alice }
      )
      await router.addLiquidityOneToken(
        2000, 0, 0, 0, [token0.address, token1.address], bob, 11571287987,
        { from: bob }
      )

      assert.equal((await token0.balanceOf(bob)).toNumber(), 10000000 - 1000 - 997)
      assert.equal((await token1.balanceOf(bob)).toNumber(), 0)
      assert.equal((await pair.totalSupply()).toNumber(), 1000996)
      assert.equal((await pair.balanceOf(bob)).toNumber(), 996)

      const reserves = await pair.getReserves()  // [token1, token0]
      if (token1.address < token0.address) {
        assert.equal(reserves[1].toNumber(), 1001997)  // balance0 = 1000000(add 1)+1000(swap)+997(add 2)
        assert.equal(reserves[0].toNumber(), 1000000)  // balance1 = 1000000(add 1)-996(swap)+996(add 2)
      } else {
        assert.equal(reserves[0].toNumber(), 1001997)  // balance0 = 1000000(add 1)+1000(swap)+997(add 2)
        assert.equal(reserves[1].toNumber(), 1000000)  // balance1 = 1000000(add 1)-996(swap)+996(add 2)
      }
    })

    it('to a pool including ETH', async () => {
      pair = await UniswapV2Pair.at((await factory.createPair(token0.address, weth.address)).logs[0].args.pair)

      const balanceBeforeAdd = await web3.eth.getBalance(bob)

      await router.addLiquidityETH(
        token0.address, 1000000, 0, 0, alice, 11571287987,
        {
          from: alice,
          value: "1000000"
        }
      )
      const txAddLiquid = await router.addLiquidityOneTokenETHExactETH(
        0, 0, 0, [weth.address, token0.address], bob, 11571287987,
        {
          from: bob,
          value: "2000"
        }
      )
      const tx = await web3.eth.getTransaction(txAddLiquid.tx)
      const gasPrice = tx.gasPrice
      const fee = txAddLiquid.receipt.gasUsed * Number(gasPrice)
      const balanceAfterAdd = await web3.eth.getBalance(bob)

      assert.equal((await token0.balanceOf(bob)).toNumber(), 0)

      const value = Number(balanceBeforeAdd) - Number(balanceAfterAdd) - fee
      assert.equal(value, 1997) // 1000(swap) + 997 (add)
      assert.equal((await pair.totalSupply()).toNumber(), 1000996)
      assert.equal((await pair.balanceOf(bob)).toNumber(), 996)

      const reserves = await pair.getReserves() // [weth, token0]
      if (weth.address < token0.address) {
        assert.equal(reserves[0].toNumber(), 1001997)  // balanceWETH = 1000000(add 1)+1000(swap)+997(add 2)
        assert.equal(reserves[1].toNumber(), 1000000) // balance0 = 1000000(add 1)-996(swap)+996(add 2)
      } else {
        assert.equal(reserves[1].toNumber(), 1001997)  // balanceWETH = 1000000(add 1)+1000(swap)+997(add 2)
        assert.equal(reserves[0].toNumber(), 1000000) // balance0 = 1000000(add 1)-996(swap)+996(add 2)
      }
    })
  })
})