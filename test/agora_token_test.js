var assert = require('assert');
var utils = require('./utils.js');

var web3 = utils.web3;

var compiled_contract = utils.compileContract(
  ['agora_token.sol', 'lib/erc20_interface.sol'],
  [
    ['icoStartBlock = 4116800','icoStartBlock = 10'],
    ['icoPremiumEndBlock = icoStartBlock + 78776','icoPremiumEndBlock = icoStartBlock + 25'],
    ['icoEndBlock = icoStartBlock + 315106','icoEndBlock = icoStartBlock + 50']
  ]
).contracts['agora_token.sol:AgoraToken']

describe('contract AgoraToken',function() {
  this.timeout(10000);

  var accounts = null;
  var subject = null;

  before(function(done) {
  	web3.eth.getAccounts(function(err, acct) {
  		accounts = acct
      utils.deployContract(accounts[0], compiled_contract).then(
        function(deployed_contract) {
          subject = deployed_contract;
          done();
        }
      );
  	});
  });

  it("rejects buy() before the ICO.", function(done){
    subject.buy({value: '100000000000000000', from: accounts[0]}, function(errors) {
      if(errors) {
        done();
      }
    });
  });

  it("rejects buy() when ICO is opened to contractOwner.", function(done){
    utils.passBlocks(9, function() {
      subject.buy({value: '100000000000000000', from: accounts[0], gas: 200000}, function(errors) {
        if(errors) {
          done();
        }
      });
    });
  });

  it("accepts buy() when ICO is opened.", function(done){
    subject.buy({value: '100000000000000000', from: accounts[1], gas: 200000}, function(errors) {
      if(!errors) {
        done();
      }
    });
  });

});
