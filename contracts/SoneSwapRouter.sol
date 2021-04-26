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
        uint amountOutMin,
        address to,
        uint deadline
    ) external virtual ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        address[] memory path = new address[](2);
        path[0] = tokenA;
        path[1] = tokenB;
        uint _amountTokenIn = amountIn.div(2);
        address _to = to;
        address _tokenA = tokenA;
        address _tokenB = tokenB;
        uint[] memory amounts = _swapExactTokensForTokensOneMode(_amountTokenIn, amountOutMin, path, to, deadline);
        {
        uint _amountAMin = amountAMin;
        uint _amountBMin = amountBMin;
        (amountA, amountB, liquidity) = _addLiquidityOneMode(_tokenA, _tokenB, _amountTokenIn, amounts[amounts.length-1], _amountAMin, _amountBMin, _to);
        }
    }

    function addLiquidityOneTokenETHExactETH(
        address token,
        uint amountTokenMin,
        uint amountETHMin,
        uint amountOutTokenMin,
        address to,
        uint deadline
    ) external virtual payable ensure(deadline) returns (uint amountToken, uint amountETH, uint liquidity) {
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = token;
        uint[] memory amounts = _swapExactETHForTokensOneMode(msg.value.div(2), amountOutTokenMin, path, to);
        (amountToken, amountETH, liquidity) = _addLiquidityETHOneMode(token, amounts[amounts.length-1], msg.value.div(2), amountTokenMin, amountETHMin, to);
    }

    function addLiquidityOneTokenETHExactToken(
        address token,
        uint amountIn,
        uint amountTokenMin,
        uint amountETHMin,
        uint amountOutETHMin,
        address to,
        uint deadline
    ) external virtual payable ensure(deadline) returns (uint amountToken, uint amountETH, uint liquidity) {
        address[] memory path = new address[](2);
            path[0] = token;
            path[1] = WETH;
        uint[] memory amounts = _swapExactTokensForETHOneMode(amountIn.div(2), amountOutETHMin, path, to, deadline);
        (amountToken, amountETH, liquidity) = _addLiquidityETHOneMode(token, amounts[amounts.length-1], amountTokenMin, amounts[1], amountETHMin, to);
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

    function _swapExactTokensForTokensOneMode(
        uint amountIn,
        uint amountOutMin,
        address[] memory path,
        address to,
        uint deadline
    ) private ensure(deadline) returns (uint[] memory amounts) {
        amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path, IUniswapV2Factory(factory).swapFee());
        require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, to);
    }

    function _addLiquidityOneMode(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to
    ) private returns (uint amountA, uint amountB, uint liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);
        TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
        TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = IUniswapV2Pair(pair).mint(to);
    }

    function _swapExactETHForTokensOneMode(
        uint amountETHMin,
        uint amountOutMin, 
        address[] memory path, 
        address to
    ) private returns (uint[] memory amounts)
    {
        require(path[0] == WETH, 'UniswapV2Router: INVALID_PATH');
        amounts = UniswapV2Library.getAmountsOut(factory, amountETHMin, path, IUniswapV2Factory(factory).swapFee());
        require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
        IWETH(WETH).deposit{value: amounts[0]}();
        assert(IWETH(WETH).transfer(UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
    }

    function _addLiquidityETHOneMode(
        address token,
        uint amountTokenDesired,
        uint amountETHDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to
    ) private returns (uint amountToken, uint amountETH, uint liquidity) {
        (amountToken, amountETH) = _addLiquidity(
            token,
            WETH,
            amountTokenDesired,
            amountETHDesired,
            amountTokenMin,
            amountETHMin
        );
        address pair = UniswapV2Library.pairFor(factory, token, WETH);
        TransferHelper.safeTransferFrom(token, msg.sender, pair, amountToken);
        IWETH(WETH).deposit{value: amountETH}();
        assert(IWETH(WETH).transfer(pair, amountETH));
        liquidity = IUniswapV2Pair(pair).mint(to);
        // refund dust eth, if any
        if (amountETHDesired > amountETH) TransferHelper.safeTransferETH(msg.sender, amountETHDesired - amountETH);
    }

    function _swapExactTokensForETHOneMode(uint amountIn, uint amountOutMin, address[] memory path, address to, uint deadline)
        private
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[path.length - 1] == WETH, 'UniswapV2Router: INVALID_PATH');
        amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path, IUniswapV2Factory(factory).swapFee());
        require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
    }
}