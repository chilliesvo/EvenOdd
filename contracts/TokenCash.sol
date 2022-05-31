// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ITokenCash.sol";
contract TokenCash is ERC20, Ownable, ITokenCash {

    constructor (string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _mint(_msgSender(), 1999 ether);
    }

    function mint(address receiver, uint256 amount) external override onlyOwner {
        _mint(receiver, amount);
    }
}