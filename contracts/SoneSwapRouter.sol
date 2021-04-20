// SPDX-License-Identifier: MIT
pragma solidity =0.6.12;

import './uniswapv2/UniswapV2Router02.sol';

contract SoneSwapRouter is UniswapV2Router02{
    constructor(address factory_, address WETH_) 
        UniswapV2Router02 (factory_, WETH_)
        public {
            
        }

    function swapExactTokensForTokensNoFee(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    )
    external ensure(deadline) returns (uint[] memory amounts) {
        amounts = UniswapV2Library.getAmountsOutNoFee(factory, amountIn, path);
        if(amounts[1] == 0) return new uint[](2);
        (address token0, address token1) = UniswapV2Library.sortTokens(path[0], path[1]);
        (uint reserve0, uint reserve1) = UniswapV2Library.getReserves(factory, path[0], path[1]);
        if(token0 == path[1] && reserve0 < amounts[1]) return new uint[](2);
        if(token1 == path[1] && reserve1 < amounts[1]) return new uint[](2);
        require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, to);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amountA, uint amountB) {
        address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);
        uint256 totalSupply = IUniswapV2Pair(pair).totalSupply();
        (amountA, amountB) = _removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline);
        _convert(tokenA, tokenB, liquidity, totalSupply, to);
    }

    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amountToken, uint amountETH) {
        address pair = UniswapV2Library.pairFor(factory, token, WETH);
        uint256 totalSupply = IUniswapV2Pair(pair).totalSupply();
        (amountToken, amountETH) = _removeLiquidity(
            token,
            WETH,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(token, to, amountToken);
        IWETH(WETH).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
        _convert(token, WETH, liquidity, totalSupply, to);
    }

    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amountA, uint amountB) {
        address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);
        uint value = approveMax ? uint(-1) : liquidity;
        IUniswapV2Pair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountA, amountB) = removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline);
    }
    function removeLiquidityETHWithPermit(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amountToken, uint amountETH) {
        address pair = UniswapV2Library.pairFor(factory, token, WETH);
        uint value = approveMax ? uint(-1) : liquidity;
        IUniswapV2Pair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountToken, amountETH) = removeLiquidityETH(token, liquidity, amountTokenMin, amountETHMin, to, deadline);
    }

    // **** REMOVE LIQUIDITY (supporting fee-on-transfer tokens) ****
    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amountETH) {
        address pair = UniswapV2Library.pairFor(factory, token, WETH);
        uint256 totalSupply = IUniswapV2Pair(pair).totalSupply();
        (, amountETH) = _removeLiquidity(
            token,
            WETH,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(token, to, IERC20(token).balanceOf(address(this)));
        IWETH(WETH).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
        _convert(token, WETH, liquidity, totalSupply, to);
    }
    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amountETH) {
        address pair = UniswapV2Library.pairFor(factory, token, WETH);
        uint value = approveMax ? uint(-1) : liquidity;
        IUniswapV2Pair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        amountETH = removeLiquidityETHSupportingFeeOnTransferTokens(
            token, liquidity, amountTokenMin, amountETHMin, to, deadline
        );
    }

    function _removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) internal ensure(deadline) returns (uint amountA, uint amountB) {
        address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);
        IUniswapV2Pair(pair).transferFrom(msg.sender, pair, liquidity); // send liquidity to pair
        (uint amount0, uint amount1) = IUniswapV2Pair(pair).burn(to);
        (address token0,) = UniswapV2Library.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, 'UniswapV2Router: INSUFFICIENT_A_AMOUNT');
        require(amountB >= amountBMin, 'UniswapV2Router: INSUFFICIENT_B_AMOUNT');
    }

    function addLiquidityOneToken(
        address tokenA,
        address tokenB,
        uint amountIn,
        uint amountAMin,
        uint amountBMin,
        unit amountOutMin,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        address[] memory path = new address[](2);
            path[0] = tokenA;
            path[1] = tokenB;
        uint[] memory amounts = swapExactTokensForTokens(amountIn.div(2), amountOutMin, path, to, deadline);
        (uint amountA, uint amountB, uint liquidity) = addLiquidity(tokenA, tokenB, amountIn.div(2), amounts[amounts.length-1], amountAMin, amountBMin, to, deadline);
    }

    function addLiquidityOneTokenETHExactETH(
        address token,
        uint amountTokenMin,
        uint amountETHMin,
        uint amountOutTokenMin,
        address to,
        uint deadline
    ) external virtual override payable ensure(deadline) returns (uint amountToken, uint amountETH, uint liquidity) {
        address[] memory path = new address[](2);
            path[0] = WETH;
            path[1] = token;
        uint[] memory amounts = swapExactETHForTokens{value: msg.value.div(2)}(amountOutTokenMin, path, to, deadline);
        (uint amountToken, uint amountETH, uint liquidity) = addLiquidityETH{value: msg.value.div(2)}(token, amounts[amounts.length-1], amountTokenMin, amountETHMin, to, deadline);
    }

    function addLiquidityOneTokenETHExactToken(
        address token,
        uint amountIn,
        uint amountTokenMin,
        uint amountETHMin,
        uint amountOutETHMin,
        address to,
        uint deadline
    ) external virtual override payable ensure(deadline) returns (uint amountToken, uint amountETH, uint liquidity) {
        address[] memory path = new address[](2);
            path[0] = token;
            path[1] = WETH;
        uint[] memory amounts = swapExactTokensForETH(amountIn.div(2), amountOutMin, path, to, deadline);
        (uint amountToken, uint amountETH, uint liquidity) = addLiquidityETH(token, amounts[amounts.length-1], amountTokenMin, amountETHMin, to, deadline);
    }


    function _convert(address tokenA, address tokenB, uint liquidity, uint totalSupply, address to) internal{
        if(IUniswapV2Factory(factory).soneConvert() != address(0)){
            ISoneConvert(IUniswapV2Factory(factory).soneConvert()).convertToSone(
                tokenA,
                tokenB,
                liquidity,
                totalSupply,
                to
            );
        }
    }
}