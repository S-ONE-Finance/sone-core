// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./uniswapv2/interfaces/IUniswapV2Pair.sol";
import "./uniswapv2/interfaces/IUniswapV2Factory.sol";
import "./uniswapv2/interfaces/IUniswapV2Router02.sol";

contract SoneConvert {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public sone;
    address public weth;
    IUniswapV2Factory public factory;
    IUniswapV2Router02 public routerv2;

    constructor(
        address _sone,
        address _weth,
        IUniswapV2Factory _factory,
        IUniswapV2Router02 _routerv2
    ) public {
        sone = _sone;
        weth = _weth;
        factory = _factory;
        routerv2 = _routerv2;
    }

    function convertToSone(
        address token0,
        address token1,
        uint256 share,
        address user
    ) external {
        // get pair
        IUniswapV2Pair pair = IUniswapV2Pair(factory.getPair(token0, token1));
        require(pair != IUniswapV2Pair(address(0)), "PAIR NOT FOUND");
        uint256 lp = pair.balanceOf(address(this));
        uint256 lpToUser = share.mul(lp);
        if (lpToUser > 0) {
            pair.transferFrom(address(this), address(pair), lpToUser);
            (uint256 amount0, uint256 amount1) = pair.burn(address(this));
            convert(pair, amount0, amount1, user);
        }
    }

    function convert(
        IUniswapV2Pair pair,
        uint256 amount0,
        uint256 amount1,
        address user
    ) public {
        address token0 = pair.token0();
        address token1 = pair.token1();

        _safeApproveForRouterV2(token0);
        _safeApproveForRouterV2(token1);

        // swap token to sone/weth
        _toBaseToken(token0, amount0);
        _toBaseToken(token1, amount1);

        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        // send token if both 2 token can not convert to sone
        if (balance0 > 0 && balance1 > 0) {
            IERC20(token0).safeTransfer(
                user,
                IERC20(token0).balanceOf(address(this))
            );
            IERC20(token1).safeTransfer(
                user,
                IERC20(token1).balanceOf(address(this))
            );
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
                _safeApproveForRouterV2(weth);
                _swap(weth, sone, IERC20(weth).balanceOf(address(this)));
            }

            // send sone to user
            if (IERC20(sone).balanceOf(address(this)) > 0) {
                IERC20(sone).safeTransfer(
                    user,
                    IERC20(sone).balanceOf(address(this))
                );
            }
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

    function _canSwap(address token0, address token1)
        internal
        view
        returns (bool)
    {
        return factory.getPair(token0, token1) != address(0);
    }

    function _swap(
        address token0,
        address token1,
        uint256 amountIn
    ) internal {
        if (factory.getPair(token0, token1) != address(0)) {
            address[] memory path = new address[](2);
            path[0] = token0;
            path[1] = token1;
            routerv2.swapExactTokensForTokens(
                amountIn,
                0,
                path,
                address(this),
                block.timestamp + 1000
            );
        }
    }

    function _safeApproveForRouterV2(address token) internal {
        IERC20(token).safeApprove(address(routerv2), 0);
        IERC20(token).safeApprove(address(routerv2), uint256(-1));
    }

}
