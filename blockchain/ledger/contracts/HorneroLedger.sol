// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HorneroLedger {

    event TransactionRegistered(
        bytes32 indexed emisor,
        bytes32 indexed receptor,
        uint256 amount,
        string txReference,
        uint256 timestamp
    );

    function registerTransaction(
        bytes32 emisor,
        bytes32 receptor,
        uint256 amount,
        string calldata txReference
    ) external {
        emit TransactionRegistered(
            emisor,
            receptor,
            amount,
            txReference,
            block.timestamp
        );
    }
}
