pragma solidity ^0.4.8;

import "./agora_token.sol";

contract AgoraClaimer {
  AgoraToken agoraToken;

  mapping (uint256 => uint256) claimerBalances;
  mapping (uint256 => mapping (address => bool)) claimings;

  event Fill(uint256 _value);
  event Claim(address indexed _owner, uint256 _value);

  function() payable {
    Fill(msg.value);
  }

  // Linking to the AgoraToken contract
  function AgoraClaimer(address _agoraTokenAddress) {
    agoraToken = AgoraToken(_agoraTokenAddress);
  }

  // Gets your Ether for the AGO tokens you own.
  function claim() returns (bool success) {
    // Gets the latest reference block number from the Agora Token contract.
    uint256 latestReferenceBlockNumber = agoraToken.latestReferenceBlockNumber();

    // Require that the user did not make a withdrwal given this reference
    // block number already.
    require(!claimings[latestReferenceBlockNumber][msg.sender]);

    // Get the AGO token balance of the User at the latest reference block
    uint256 userAgoraBalance = agoraToken.balanceAtBlock(msg.sender, latestReferenceBlockNumber);

    // Calculate the part of the user.
    uint256 userValue = (userAgoraBalance / agoraToken.totalSupply()) * claimerBalanceAtBlock(latestReferenceBlockNumber);

    // Require the user to have something to withdraw.
    require(userValue > 0);

    // Write that the transaction have been done for this reference block number.
    claimings[latestReferenceBlockNumber][msg.sender] = true;

    // Make the transaction
    msg.sender.transfer(userValue);
    Claim(msg.sender, userValue);
    
    return true;
  }

  // This method return the balance of the Claimer at a known reference block number.
  // If it is the first time it is asked for this reference number, we save it.
  // That way, when another ask for this reference number, the grand total to
  // share between AGO owners is known and static.
  function claimerBalanceAtBlock(uint256 blockNumber) private returns (uint256 balance) {
    uint256 possible_balance = claimerBalances[blockNumber];
    if(possible_balance == 0) {
      claimerBalances[blockNumber] = address(this).balance;
    }
    return claimerBalances[blockNumber];
  }
}
