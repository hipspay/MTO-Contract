// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AccessControl {
    address private owner = address(0);

    modifier isOwner(address _owner) {
        require(owner == _owner, "Caller is not owner");
        _;
    }

    modifier setOwner(address _owner) {
        require(
            owner == address(0) || msg.sender == owner,
            "Only current owner can handle access control"
        );
        owner = _owner;
        _;
    }
}
