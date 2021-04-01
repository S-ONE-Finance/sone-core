// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;
import "./IUniswapV2Pair.sol";


interface ISoneConvert {
    function convertToLua(address token0, address token1, uint256 liquidity, uint256 totalSupply, address to) external;
}