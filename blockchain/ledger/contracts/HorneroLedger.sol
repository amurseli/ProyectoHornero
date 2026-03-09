// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HorneroLedger {

    event TransactionRegistered(
        string emisor,
        string receptor,
        uint256 amount,
        string txReference,
        uint256 timestamp
    );

    function registerTransaction(
        string calldata emisor,
        string calldata receptor,
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
