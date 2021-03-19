// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
// SoneSafe is the coolest warehouse in town. You come in with some Sone, and leave with more! The longer you stay, the more Sone you get.
//
// This contract handles swapping to and from xSone, SoneSwap's staking token.
contract SoneSafe is ERC20("SoneSafe", "xSONE") {
    using SafeMath for uint256;
    IERC20 public sone;
    uint256 public FEE = 5;
    // Define the Sone token contract
    constructor(IERC20 _sone) public {
        sone = _sone;
    }
    
    // Enter the warehouse. store some SONEs. Earn some shares.
    // Locks Sone and mints xSone
    function enter(uint256 _amount) public {
        // Gets the amount of Sone locked in the contract
        uint256 totalSone = sone.balanceOf(address(this));
        // Gets the amount of xSone in existence
        uint256 totalShares = totalSupply();
        // If no xSone exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalSone == 0) {
            _mint(msg.sender, _amount);
        } 
        // Calculate and mint the amount of xSone the Sone is worth. The ratio will change overtime, as xSone is burned/minted and Sone deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalSone);
            _mint(msg.sender, what);
        }
        // Lock the Sone in the contract
        sone.transferFrom(msg.sender, address(this), _amount);
    }
    // Leave the warehouse. Claim back your SONEs.
    // Unclocks the staked + gained Sone and burns xSone
    function leave(uint256 _share) public {
        uint256 totalShares = totalSupply();
        uint soneBal = sone.balanceOf(address(this));
        uint256 what = _share.mul(soneBal).div(totalShares);
        uint fee = _getWithdrawFee(what);
        _burn(msg.sender, _share);
        sone.transfer(msg.sender, what.sub(fee));
    }
    function _getWithdrawFee(uint liquidity) private view returns (uint withdrawFee) {
        withdrawFee = liquidity.mul(FEE).div(1000);
    }
}