// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/EchoBox.sol";

contract Deploy is Script {
    function run() public returns (EchoBox) {
        vm.startBroadcast();
        EchoBox echoBox = new EchoBox();
        vm.stopBroadcast();
        return echoBox;
    }
}
