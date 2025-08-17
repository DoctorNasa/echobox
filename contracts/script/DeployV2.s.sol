// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {GiftBoxV2} from "../src/GiftBoxV2.sol";

contract DeployV2Script is Script {
    function run() external returns (GiftBoxV2) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        GiftBoxV2 giftBox = new GiftBoxV2();
        
        vm.stopBroadcast();
        
        return giftBox;
    }
}
