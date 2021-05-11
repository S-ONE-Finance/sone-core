pragma solidity >=0.6.2;

import './IUniswapV2Router02.sol';

interface ISoneSwapRouter is IUniswapV2Router02 {
    function swapExactTokensForTokensNoFee(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function addLiquidityOneToken(
        uint amountIn,
        uint amountAMin,
        uint amountBMin,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);

    function addLiquidityOneTokenETHExactETH(
        uint amountTokenMin,
        uint amountETHMin,
        uint amountOutTokenMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);

    function addLiquidityOneTokenETHExactToken(
        uint amountIn,
        uint amountTokenMin,
        uint amountETHMin,
        uint amountOutETHMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
}