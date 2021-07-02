import BN from "bn.js";
import {
  MockERC20Instance,
  SoneConvertInstance,
  SoneSwapRouterInstance,
  SoneTokenInstance,
  UniswapV2FactoryInstance,
  UniswapV2PairInstance,
  WETH9Instance,
} from "../types/truffle-contracts";

const { expectRevert } = require("@openzeppelin/test-helpers");

const MockERC20 = artifacts.require("MockERC20");
const WETH = artifacts.require("WETH9");
const UniswapV2Factory = artifacts.require("UniswapV2Factory");
const UniswapV2Pair = artifacts.require("UniswapV2Pair");
const SoneSwapRouter = artifacts.require("SoneSwapRouter");
const SoneConvert = artifacts.require("SoneConvert");
const SoneToken = artifacts.require("SoneToken");
const revertMsg = require("./constants/error-msg.js").revertMsg;

const _BN = (str: string | number) => new BN(str);

const MINIMUM_LIQUIDITY = 1000;

contract("SoneSwapRouter - Withdraw Liquidity", ([alice, bob, owner]) => {
  let _weth: WETH9Instance;
  let _factory: UniswapV2FactoryInstance;
  let _router: SoneSwapRouterInstance;
  let _token0: MockERC20Instance;
  let _token1: MockERC20Instance;
  let _pair: UniswapV2PairInstance;
  let _soneToken: SoneTokenInstance;
  let _soneConvert: SoneConvertInstance;

  beforeEach(async () => {
    // Initialize contract instances
    _weth = await WETH.new({ from: owner });
    _factory = await UniswapV2Factory.new(owner, { from: owner });
    _router = await SoneSwapRouter.new(_factory.address, _weth.address, {
      from: owner,
    });
    _soneToken = await SoneToken.new(1, 1000, { from: owner });
    _soneConvert = await SoneConvert.new(process.env.SONE_ADDRESS || "", _weth.address, _factory.address, _router.address, { from: owner });
    _token0 = await MockERC20.new("TOKEN0", "TOKEN0", "50000000", {
      from: owner,
    });
    _token1 = await MockERC20.new("TOKEN1", "TOKEN1", "50000000", {
      from: owner,
    });
    // Get pool address of the pair token0-token1
    _pair = await UniswapV2Pair.at((await _factory.createPair(_token0.address, _token1.address)).logs[0].args.pair);
    const blkNumber = await web3.eth.getBlockNumber();
    await _soneToken.setAllowTransferOn(blkNumber + 1, { from: owner });
    // Transfer tokens to alice address
    await _token0.transfer(alice, 10000000, { from: owner });
    await _token1.transfer(alice, 10000000, { from: owner });

    // Approve allowance to spend alice's tokens for the router
    await _token0.approve(_router.address, 1000000, { from: alice });
    await _token1.approve(_router.address, 1000000, { from: alice });
  });

  describe("# withdraw liquidity in a pool excluding ETH", async () => {
    beforeEach(async () => {
      // add liquidity to new pool
      await _router.addLiquidity(_token0.address, _token1.address, 1000000, 1000000, 0, 0, alice, 11571287987, { from: alice });
    });

    it("burn without fee", async () => {
      // Approve allowance to spend alice's lp token for the router
      await _pair.approve(_router.address, 1000000 - MINIMUM_LIQUIDITY, {
        from: alice,
      });
      // check alice lp token balance
      assert.equal(
        (await _pair.balanceOf(alice)).valueOf(),
        1000000 - MINIMUM_LIQUIDITY,
        "Alice's lp token balance equal to 1000000 - MINIMUM_LIQUIDITY"
      );
      // Remove liquidity
      await _router.removeLiquidity(_token0.address, _token1.address, 1000000 - MINIMUM_LIQUIDITY, 0, 0, alice, 11571287987, {
        from: alice,
      });
      // check totalSupply and alice lp token balance
      assert.equal((await _pair.totalSupply()).valueOf(), MINIMUM_LIQUIDITY, "totalSupply equal to MINIMUM_LIQUIDITY");
      assert.equal((await _pair.balanceOf(alice)).valueOf(), 0, "alice's lp token balance equal to 0");
      // check reserves
      const reserves = await _pair.getReserves();
      assert.equal(reserves[0].valueOf(), MINIMUM_LIQUIDITY, "reserves[0] equal to MINIMUM_LIQUIDITY");
      assert.equal(reserves[1].valueOf(), MINIMUM_LIQUIDITY, "reserves[1] equal to MINIMUM_LIQUIDITY");
    });

    it("burn with fee", async () => {
      await _factory.setWithdrawFeeTo(bob, { from: owner });
      // Approve allowance to spend alice's lp token for the router
      await _pair.approve(_router.address, 1000000 - MINIMUM_LIQUIDITY, {
        from: alice,
      });
      // check alice's lp token balance
      assert.equal(
        (await _pair.balanceOf(alice)).valueOf(),
        1000000 - MINIMUM_LIQUIDITY,
        "Alice's lp token balance equal to 1000000 - MINIMUM_LIQUIDITY"
      );
      // Remove liquidity
      await _router.removeLiquidity(_token0.address, _token1.address, 1000000 - MINIMUM_LIQUIDITY, 0, 0, alice, 11571287987, {
        from: alice,
      });
      // check total supply and alice's lp token balance
      assert.equal((await _pair.totalSupply()).valueOf(), MINIMUM_LIQUIDITY + 999, "totalSupply equal to INIMUM_LIQUIDITY + 999");
      assert.equal((await _pair.balanceOf(alice)).valueOf(), 0, "Alice's lp token balance equal to 0");
      // check alice tokens balance
      assert.equal((await _token0.balanceOf(alice)).valueOf(), 9998001, "alice's token0 balance equal to 9998001");
      assert.equal((await _token1.balanceOf(alice)).valueOf(), 9998001, "alice's token1 balance equal to 9998001");
      // check bob's lp token balance
      assert.equal((await _pair.balanceOf(bob)).valueOf(), 999, "bob's lp token balance equal to 999");
      // check reserves
      const reserves = await _pair.getReserves();
      assert.equal(reserves[0].valueOf(), 1999, "reserves[0] equal to 1999");
      assert.equal(reserves[1].valueOf(), 1999, "reserves[1] equal to 1999");
    });

    it("revert: burn with token amount min over the token reserve", async () => {
      // Approve allowance to spend alice's lp token for the router
      await _pair.approve(_router.address, 1000000 - MINIMUM_LIQUIDITY, {
        from: alice,
      });
      // check failed condition
      await expectRevert(
        _router.removeLiquidity(_token0.address, _token1.address, 1000000 - MINIMUM_LIQUIDITY, 1000000, 1000000, alice, 11571287987, {
          from: alice,
        }),
        revertMsg.INSUFFICIENT_A_AMOUNT
      );
    });

    it("revert: burn with liquidity amount over the pool's liquidity", async () => {
      // Approve allowance to spend alice's lp token for the router
      await _pair.approve(_router.address, 1000000 - MINIMUM_LIQUIDITY, {
        from: alice,
      });
      // check alice's lp token balance
      assert.equal(
        (await _pair.balanceOf(alice)).valueOf(),
        1000000 - MINIMUM_LIQUIDITY,
        "Alice's lp token balance equal to 1000000 - MINIMUM_LIQUIDITY"
      );
      // check catch overflow condition
      await expectRevert(
        _router.removeLiquidity(_token0.address, _token1.address, 1000000, 1000000, 1000000, alice, 11571287987, { from: alice }),
        revertMsg.SUBTRACTION_OVERFLOW
      );
    });

    it("revert: burn zero output amount", async () => {
      // Approve allowance to spend alice's token0 for the router
      await _token0.approve(_router.address, 1000, { from: alice });
      // Approve allowance to spend alice's lp token for the router
      await _pair.approve(_router.address, 1000000 - MINIMUM_LIQUIDITY, {
        from: alice,
      });
      // check alice's lp token balance
      assert.equal(
        (await _pair.balanceOf(alice)).valueOf(),
        1000000 - MINIMUM_LIQUIDITY,
        "Alice's lp token balance equal to 1000000 - MINIMUM_LIQUIDITY"
      );
      // swap
      await _router.swapExactTokensForTokens(1000, 0, [_token0.address, _token1.address], alice, 11571287987, { from: alice });
      // check catch wrong amount liquidity
      await expectRevert(
        _router.removeLiquidity(_token0.address, _token1.address, 1, 0, 0, alice, 11571287987, { from: alice }),
        revertMsg.INSUFFICIENT_LIQUIDITY_BURNED
      );
    });
  });

  describe("# withdraw liquidity in a pool including ETH", async () => {
    beforeEach(async () => {
      // Get pool address of the pair token0-WETH
      _pair = await UniswapV2Pair.at((await _factory.createPair(_token0.address, _weth.address)).logs[0].args.pair);
      // add liquidity to new pool
      await _router.addLiquidityETH(_token0.address, 1000000, 0, 0, alice, 11571287987, {
        from: alice,
        value: _BN(1000000),
      });
    });

    it("burn without fee", async () => {
      // Approve allowance to spend alice's lp token for the router
      await _pair.approve(_router.address, 1000000 - MINIMUM_LIQUIDITY, {
        from: alice,
      });
      // check alice's lp token balance
      assert.equal(
        (await _pair.balanceOf(alice)).valueOf(),
        1000000 - MINIMUM_LIQUIDITY,
        "Alice's lp token balance equal to 1000000 - MINIMUM_LIQUIDITY"
      );
      // Remove liquidity
      await _router.removeLiquidityETH(_token0.address, 1000000 - MINIMUM_LIQUIDITY, 0, 0, alice, 11571287987, { from: alice });
      // check total supply and alice's lp token balance
      assert.equal((await _pair.totalSupply()).valueOf(), MINIMUM_LIQUIDITY, "totalSupply equal to MINIMUM_LIQUIDITY");
      assert.equal((await _pair.balanceOf(alice)).valueOf(), 0, "Alice's lp token balance equal to 0");
      // check reserve tokens
      const reserves = await _pair.getReserves();
      assert.equal(reserves[0].valueOf(), MINIMUM_LIQUIDITY, "reserves[0] equal to MINIMUM_LIQUIDITY");
      assert.equal(reserves[1].valueOf(), MINIMUM_LIQUIDITY, "reserves[1] equal to MINIMUM_LIQUIDITY");
    });

    it("burn with fee", async () => {
      await _factory.setWithdrawFeeTo(bob, { from: owner });
      // Approve allowance to spend alice's lp token for the router
      await _pair.approve(_router.address, 1000000 - MINIMUM_LIQUIDITY, {
        from: alice,
      });
      // check alice's lp token balance
      assert.equal(
        (await _pair.balanceOf(alice)).valueOf(),
        1000000 - MINIMUM_LIQUIDITY,
        "Alice's lp token balance equal to 1000000 - MINIMUM_LIQUIDITY"
      );
      // Remove liquidity
      await _router.removeLiquidityETH(_token0.address, 1000000 - MINIMUM_LIQUIDITY, 0, 0, alice, 11571287987, { from: alice });
      // check total supply and alice's lp token and token0 balance
      assert.equal((await _pair.totalSupply()).valueOf(), MINIMUM_LIQUIDITY + 999, "totalSupply equal to MINIMUM_LIQUIDITY + 999");
      assert.equal((await _pair.balanceOf(alice)).valueOf(), 0, "Alice's lp token balance equal to 0");
      assert.equal((await _token0.balanceOf(alice)).valueOf(), 9998001, "Alice's token0balance equal to 9998001");
      // check bob's lp token balance
      assert.equal((await _pair.balanceOf(bob)).valueOf(), 999, "bob's lp token balance equal to 999");
      // check reserve tokens
      const reserves = await _pair.getReserves();
      assert.equal(reserves[0].valueOf(), 1999, "reserves[0] equal to 1999");
      assert.equal(reserves[1].valueOf(), 1999, "reserves[1] equal to 1999");
    });
  });

  describe.only("# withdraw liquidity with sone convert", async () => {
    beforeEach(async () => {
      // Transfer tokens to bob address
      await _token0.transfer(bob, 10000000, { from: owner });
      await _token1.transfer(bob, 10000000, { from: owner });

      // Appove allowance to spend bob's tokens for the router
      await _token0.approve(_router.address, 1000000, { from: bob });
      await _token1.approve(_router.address, 1000000, { from: bob });

      // Config addresses
      await _factory.setSoneConvert(_soneConvert.address, {
        from: owner,
      });
      await _factory.setFeeTo(owner, { from: owner });

      // Alice add liquidity
      await _router.addLiquidity(_token0.address, _token1.address, 1000000, 1000000, 0, 0, alice, 11571287987, { from: alice });
      // Bob add liquidity
      await _token0.approve(_router.address, 1000000, { from: bob });
      await _token1.approve(_router.address, 1000000, { from: bob });
      await _router.addLiquidity(_token0.address, _token1.address, 1000000, 1000000, 0, 0, bob, 11571287987, { from: bob });
    });

    it("return sone when exist 1 token can swap to SONE", async () => {
      const _pairSone = await UniswapV2Pair.at((await _factory.createPair(_token0.address, _soneToken.address)).logs[0].args.pair);
      _soneToken.mint(alice, 10000000, { from: owner });
      // Approve allowance to spend alice's sone token for the router
      await _soneToken.approve(_router.address, 1000000, {
        from: alice,
      });
      await _token0.approve(_router.address, 1000000, { from: alice });

      // / add liquidity to new pool token0 and sone
      await _router.addLiquidity(_token0.address, _soneToken.address, 1000000, 1000000, 0, 0, alice, 11571287987, {
        from: alice,
      });
      // Swap
      for (let index = 1; index < 30; index++) {
        // Approve allowance to spend alice's token0 for the router
        await _token0.approve(_router.address, 1000, { from: alice });
        await _router.swapExactTokensForTokens(1000, 0, [_token0.address, _token1.address], alice, 11571287987, { from: alice });
      }
      // Remove liquidity
      await _pair.approve(_router.address, 1000000, { from: bob });
      await _router.removeLiquidity(_token0.address, _token1.address, 1000000, 0, 0, bob, 11571287987, { from: bob });
      // check bob tokens balance
      console.log("cdssav", (await _token0.balanceOf(bob)).toNumber());

      // assert.equal((await _token0.balanceOf(bob)).toNumber(), 10014491, "Bob's token0 balance equal to 10014491"); //  9000000 (balance) + 1014491 (remove liquid)
      assert.equal((await _token1.balanceOf(bob)).toNumber(), 9985750, "Bob's token1 balance equal to 9985750"); // 9000000 (balance) + 985750 (remove liquid)
      assert.equal((await _soneToken.balanceOf(bob)).toNumber(), 5, "Bob's sone token balance equal to 5"); // 3 (covert from token0-sone) + 2 (covert from token1-token0-sone)
    });

    it("return 2 tokens from convert", async () => {
      // Swap
      for (let index = 1; index < 30; index++) {
        await _token0.approve(_router.address, 1000, { from: alice });
        await _router.swapExactTokensForTokens(1000, 0, [_token0.address, _token1.address], alice, 11571287987, { from: alice });
      }

      // Remove liquidity
      await _pair.approve(_router.address, 1000000, { from: bob });
      await _router.removeLiquidity(_token0.address, _token1.address, 1000000, 0, 0, bob, 11571287987, { from: bob });
      // check bob tokens balance
      assert.equal((await _token0.balanceOf(bob)).valueOf(), 10014495, "Bob's token0 balance equal to 10014495"); //  9000000 (balance) + 1014491 (remove liquid) + 4 (from convert)
      assert.equal((await _token1.balanceOf(bob)).valueOf(), 9985753, "Bob's token1 balance equal to 9985753"); // 9000000 (balance) + 985750 (remove liquid) + 3 (from convert)
    });
  });
});
