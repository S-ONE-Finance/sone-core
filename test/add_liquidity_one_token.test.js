const UniswapV2Factory = artifacts.require('UniswapV2Factory')
const UniswapV2Pair = artifacts.require('UniswapV2Pair')
const WETH = artifacts.require('WETH9')
const SoneSwapRouter = artifacts.require('SoneSwapRouter')
const MockERC20 = artifacts.require('MockERC20')
const BigNumber = require('bn.js')
var BN = (s) => new BigNumber(s.toString(), 10)

contract('liquidity 1 token', ([alice, bob, owner]) => {
  beforeEach(async () => {
    this.factory = await UniswapV2Factory.new(owner, { from: owner })
    this.token0 = await MockERC20.new('TOKEN0', 'TOKEN0', '10000000', { from: alice })
    this.token1 = await MockERC20.new('TOKEN1', 'TOKEN1', '10000000', { from: alice })
    this.weth = await WETH.new({ from: owner })
    this.router = await SoneSwapRouter.new(this.factory.address, this.weth.address, { from: owner })
    this.swapFee = await this.factory.swapFee()
  })

  describe('#2 token', async () => {
    beforeEach(async() => {
      this.pair = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.token1.address)).logs[0].args.pair)
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
    it('mint', async () => {

        await this.token0.mint(bob, 10000000)
        await this.token0.approve(this.router.address, 1000000, { from: bob })
        await this.token1.approve(this.router.address, 1000000, { from: bob })
        await this.router.addLiquidityOneToken(
            2000,
            0,
            0,
            0,
            [this.token0.address, this.token1.address],
            bob,
            11571287987,
            { from: bob
            }
        )
        assert.equal((await this.token0.balanceOf(bob)).valueOf(), 10000000-1000-997)
        assert.equal((await this.token1.balanceOf(bob)).valueOf(), 0)
        assert.equal((await this.pair.totalSupply()).valueOf(), 1000996)
        assert.equal((await this.pair.balanceOf(bob)).valueOf(), 996)
        const reserves = await this.pair.getReserves() // [token1, token0]
        if (this.token1.address < this.token0.address){
          assert.equal(reserves[1].valueOf(), 1001997)  // balance0 = 1000000(add 1)+1000(swap)+997(add 2)
          assert.equal(reserves[0].valueOf(), 1000000) // balance1 = 1000000(add 1)-996(swap)+996(add 2)
        }else{
          assert.equal(reserves[0].valueOf(), 1001997)  // balance0 = 1000000(add 1)+1000(swap)+997(add 2)
          assert.equal(reserves[1].valueOf(), 1000000) // balance1 = 1000000(add 1)-996(swap)+996(add 2)
        }
    })
  });

  describe('# with ETH exec ETH', async () => {
    beforeEach(async() => {
      this.pair = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.weth.address)).logs[0].args.pair)
      await this.token0.approve(this.router.address, 1000000,  {from: alice })
      await this.router.addLiquidityETH(
        this.token0.address,
        1000000,
        0,
        0,
        alice,
        11571287987,
        {
          from: alice,
          value: 1000000
        }
      )

    })

    it('mint', async () => {
        // await this.token0.mint(bob, 10000000)
        await this.token0.approve(this.router.address, 1000000, { from: bob })
        const balanceBeforeAdd = await web3.eth.getBalance(bob);
        const txAddLiquid = await this.router.addLiquidityOneTokenETHExactETH(
            0,
            0,
            0,
            [this.weth.address, this.token0.address],
            bob,
            11571287987,
            { from: bob,
              value: 2000
            }
        )

        assert.equal((await this.token0.balanceOf(bob)).valueOf(), 0)

        const tx = await web3.eth.getTransaction(txAddLiquid.tx);
        const gasPrice = tx.gasPrice;
        const fee = txAddLiquid.receipt.gasUsed * gasPrice;
        const balanceAfterAdd = await web3.eth.getBalance(bob);

        const value = BN(balanceBeforeAdd).sub(BN(balanceAfterAdd)).sub(BN(fee));
        assert.equal(value.valueOf(), 1997) // 1000(swap) + 997 (add)

        assert.equal((await this.pair.totalSupply()).valueOf(), 1000996)
        assert.equal((await this.pair.balanceOf(bob)).valueOf(), 996)
        const reserves = await this.pair.getReserves() // [weth, token0]
        if (this.weth.address < this.token0.address){
          assert.equal(reserves[0].valueOf(), 1001997)  // balanceWETH = 1000000(add 1)+1000(swap)+997(add 2)
          assert.equal(reserves[1].valueOf(), 1000000) // balance0 = 1000000(add 1)-996(swap)+996(add 2)
        }else{
          assert.equal(reserves[1].valueOf(), 1001997)  // balanceWETH = 1000000(add 1)+1000(swap)+997(add 2)
          assert.equal(reserves[0].valueOf(), 1000000) // balance0 = 1000000(add 1)-996(swap)+996(add 2)
        }
    })
  });


  describe('# with ETH exec token', async () => {
    beforeEach(async() => {
      this.pair = await UniswapV2Pair.at((await this.factory.createPair(this.token0.address, this.weth.address)).logs[0].args.pair)
      await this.token0.approve(this.router.address, 1000000,  {from: alice })
      await this.router.addLiquidityETH(
        this.token0.address,
        1000000,
        0,
        0,
        alice,
        11571287987,
        {
          from: alice,
          value: 1000000
        }
      )
    })
    it('mint', async () => {
        await this.token0.mint(bob, 10000000)
        await this.token0.approve(this.router.address, 1000000, { from: bob })
        const balanceBeforeAdd = await web3.eth.getBalance(bob);
        const txAddLiquid = await this.router.addLiquidityOneTokenETHExactToken(
            2000,
            0,
            0,
            0,
            [this.token0.address, this.weth.address],
            bob,
            11571287987,
            { 
              from: bob
            }
        )
        const tx = await web3.eth.getTransaction(txAddLiquid.tx);
        const gasPrice = tx.gasPrice;
        const fee = txAddLiquid.receipt.gasUsed * gasPrice;
        const balanceAfterAdd = await web3.eth.getBalance(bob);

        const value = BN(balanceBeforeAdd).sub(BN(balanceAfterAdd)).sub(BN(fee));
        assert.equal(value.valueOf(), 0)
        assert.equal((await this.token1.balanceOf(bob)).valueOf(), 0)

        assert.equal((await this.pair.totalSupply()).valueOf(), 1000996)
        assert.equal((await this.pair.balanceOf(bob)).valueOf(), 996)
        const reserves = await this.pair.getReserves() // [token0, weth]
        if (this.token0.address < this.weth.address){
          assert.equal(reserves[0].valueOf(), 1001997)  // balance0 = 1000000(add 1)+1000(swap)+997(add 2)
          assert.equal(reserves[1].valueOf(), 1000000) // balanceWETH = 1000000(add 1)-996(swap)+996(add 2)
        }else{
          assert.equal(reserves[1].valueOf(), 1001997)  // balance0 = 1000000(add 1)+1000(swap)+997(add 2)
          assert.equal(reserves[0].valueOf(), 1000000) // balanceWETH = 1000000(add 1)-996(swap)+996(add 2)
        }
    })
  });
})