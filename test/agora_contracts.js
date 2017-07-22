const assert = require('assert');
const BigNumber = require('bignumber.js');
const utils = require('./utils.js');
const web3 = utils.web3;

module.exports = utils.compileContract(
  ['agora_token.sol', 'lib/erc20_interface.sol', 'agora_claimer.sol'],
  [
    ['icoStartBlock = 4116800','icoStartBlock = 10'],
    ['icoPremiumEndBlock = icoStartBlock + 78776','icoPremiumEndBlock = icoStartBlock + 25'],
    ['icoEndBlock = icoStartBlock + 315106','icoEndBlock = icoStartBlock + 50'],
    ['uint256 constant minimumToRaise = 500 ether;', 'uint256 constant minimumToRaise = 30 ether;'],
    ['return (block.number - block.number % 157553);', 'return (block.number - block.number % 50);']
  ]
).contracts;
