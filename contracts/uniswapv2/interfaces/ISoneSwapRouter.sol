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
}