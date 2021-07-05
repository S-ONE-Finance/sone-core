// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.6.2;

import "../uniswapv2/interfaces/IUniswapV2Router02.sol";

interface ISoneSwapRouter is IUniswapV2Router02 {
	function swapExactTokensForTokensNoFee(
		uint256 amountIn,
		uint256 amountOutMin,
		address[] calldata path,
		address to,
		uint256 deadline
	) external returns (uint256[] memory amounts);

	function addLiquidityOneToken(
		uint256 amountIn,
		uint256 amountAMin,
		uint256 amountBMin,
		uint256 amountOutMin,
		address[] calldata path,
		address to,
		uint256 deadline
	)
		external
		returns (
			uint256 amountA,
			uint256 amountB,
			uint256 liquidity
		);

	function addLiquidityOneTokenETHExactETH(
		uint256 amountTokenMin,
		uint256 amountETHMin,
		uint256 amountOutTokenMin,
		address[] calldata path,
		address to,
		uint256 deadline
	)
		external
		payable
		returns (
			uint256 amountToken,
			uint256 amountETH,
			uint256 liquidity
		);

	function addLiquidityOneTokenETHExactToken(
		uint256 amountIn,
		uint256 amountTokenMin,
		uint256 amountETHMin,
		uint256 amountOutETHMin,
		address[] calldata path,
		address to,
		uint256 deadline
	)
		external
		payable
		returns (
			uint256 amountToken,
			uint256 amountETH,
			uint256 liquidity
		);
}
