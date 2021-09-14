// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./uniswapv2/interfaces/IUniswapV2Pair.sol";
import "./uniswapv2/interfaces/IUniswapV2Factory.sol";
import "./interfaces/ISoneSwapRouter.sol";

contract SoneConvert {
	using SafeMath for uint256;
	using SafeERC20 for IERC20;

	address public sone;
	address public weth;
	IUniswapV2Factory public factory;
	ISoneSwapRouter public soneSwapRouter;
	bytes4 private constant SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));

	modifier routerSender() {
		require(address(soneSwapRouter) == msg.sender, "routerSender: caller is soneswap router");
		_;
	}

	constructor(
		address _sone,
		address _weth,
		IUniswapV2Factory _factory,
		ISoneSwapRouter _soneSwapRouter
	) public {
		sone = _sone;
		weth = _weth;
		factory = _factory;
		soneSwapRouter = _soneSwapRouter;
	}

	function convertToSone(
		address token0,
		address token1,
		uint256 liquidity,
		uint256 totalSupply,
		address to
	) external routerSender{
		// get pair
		IUniswapV2Pair pair = IUniswapV2Pair(factory.getPair(token0, token1));
		require(pair != IUniswapV2Pair(address(0)), "PAIR NOT FOUND");
		uint256 lp = pair.balanceOf(address(this));
		uint256 liquidityOfProvider = totalSupply.sub(lp).sub(pair.balanceOf(address(factory.feeTo())));
		uint256 lpToUser = liquidity.mul(lp).div(liquidityOfProvider);
		if (lpToUser > 0) {
			_safeTransfer(address(pair), address(pair), lpToUser);
			// pair.transferFrom(address(this), address(pair), lpToUser);
			(uint256 amount0, uint256 amount1) = pair.burn(address(this));
			convert(pair, amount0, amount1, to);
		}
	}

	function convert(
		IUniswapV2Pair pair,
		uint256 amount0,
		uint256 amount1,
		address to
	) internal {
		address token0 = pair.token0();
		address token1 = pair.token1();

		_safeApproveForsoneSwapRouter(token0);
		_safeApproveForsoneSwapRouter(token1);

		// swap token to sone/weth
		_toBaseToken(token0, amount0);
		_toBaseToken(token1, amount1);

		uint256 balance0 = IERC20(token0).balanceOf(address(this));
		uint256 balance1 = IERC20(token1).balanceOf(address(this));
		// send token if both 2 token can not convert to sone
		if (balance0 > 0 && balance1 > 0) {
			IERC20(token0).safeTransfer(to, IERC20(token0).balanceOf(address(this)));
			IERC20(token1).safeTransfer(to, IERC20(token1).balanceOf(address(this)));
		} else {
			if (balance0 > 0 && balance1 == 0) {
				_swap(token0, token1, balance0);
				_toBaseToken(token1, IERC20(token1).balanceOf(address(this)));
			}
			if (balance0 == 0 && balance1 > 0) {
				_swap(token1, token0, balance1);
				_toBaseToken(token0, IERC20(token0).balanceOf(address(this)));
			}
			// swap weth to sone
			if (IERC20(weth).balanceOf(address(this)) > 0) {
				_safeApproveForsoneSwapRouter(weth);
				_swap(weth, sone, IERC20(weth).balanceOf(address(this)));
			}

			// send token to user
			_transferTokenRemain(sone, to);
			_transferTokenRemain(weth, to);
			_transferTokenRemain(token0, to);
			_transferTokenRemain(token1, to);
		}
	}

	function _toBaseToken(address token, uint256 amountIn) internal {
		if (token == sone) return;

		if (_canSwap(token, sone)) {
			_swap(token, sone, amountIn);
		} else if (_canSwap(token, weth)) {
			_swap(token, weth, amountIn);
		}
	}

	function _canSwap(address token0, address token1) internal view returns (bool) {
		return factory.getPair(token0, token1) != address(0);
	}

	function _swap(
		address token0,
		address token1,
		uint256 amountIn
	) internal {
		if (token0 == weth && token1 != sone) return;
		if (factory.getPair(token0, token1) != address(0) && amountIn > 0) {
			address[] memory path = new address[](2);
			path[0] = token0;
			path[1] = token1;
			soneSwapRouter.swapExactTokensForTokensNoFee(amountIn, 0, path, address(this), block.timestamp + 1000);
		}
	}

	function _safeApproveForsoneSwapRouter(address token) internal {
		IERC20(token).safeApprove(address(soneSwapRouter), 0);
		IERC20(token).safeApprove(address(soneSwapRouter), uint256(-1));
	}

	function _safeTransfer(
		address token,
		address to,
		uint256 value
	) internal {
		(bool success, bytes memory data) = token.call(abi.encodeWithSelector(SELECTOR, to, value));
		require(success && (data.length == 0 || abi.decode(data, (bool))), "UniswapV2: TRANSFER_FAILED");
	}

	function _transferTokenRemain(address token, address to) internal {
		if (IERC20(token).balanceOf(address(this)) > 0) {
			IERC20(token).safeTransfer(to, IERC20(token).balanceOf(address(this)));
		}
	}
}
