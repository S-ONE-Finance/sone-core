// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.6.12;

interface ISoneToken {

    event Lock(address indexed to, uint256 value);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    event WhitelistAdded(address indexed account);
    event WhitelistRemoved(address indexed account);
    event WhitelistRevoked(address indexed account);

    function circulatingSupply() external view returns (uint256);
    function totalLock() external view returns (uint256);
    function mint(address _to, uint256 _amount) external;
    function totalBalanceOf(address _holder) external view returns (uint256);
    function lockOf(address _holder) external view returns (uint256);
    function lastUnlockBlock(address _holder) external view returns (uint256);
    function lock(address _holder, uint256 _amount) external;
    function canUnlockAmount(address _holder) external view returns (uint256);
    function unlock() external;
    function transferAll(address _to) external;
    function setLockFromBlock(uint256 lockFromBlock_) external;
    function setLockToBlock(uint256 lockToBlock_) external;
    function setAllowTransferOn(uint256 allowTransferOn_) external;

    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function increaseAllowance(address spender, uint256 addedValue) external returns (bool);
    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool);

    function cap() external view returns (uint256);

    function burn(uint256 amount) external ;
    function burnFrom(address account, uint256 amount) external;

    function transferOwnership(address newOwner) external;
    function owner() external view returns (address);
    function renounceOwnership() external;

    function isWhitelist(address account) external view returns (bool);
    function addWhitelist(address account) external;
    function renounceWhitelist() external;
    function revokeWhitelist(address account_) external;
}