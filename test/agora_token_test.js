const assert = require('assert');
const BigNumber = require('bignumber.js');
const utils = require('./utils.js');
const web3 = utils.web3;

const agora_contracts = require('./agora_contracts.js');

describe('contract AgoraToken',function() {
  this.timeout(10000);

  var accounts = null;
  var subject = null;

  before(function(done) {
  	web3.eth.getAccounts(function(err, acct) {
  		accounts = acct
      utils.deployContract(accounts[0], agora_contracts['agora_token.sol:AgoraToken']).then(
        function(deployed_contract) {
          subject = deployed_contract;
          done();
        }
      );
  	});
  });

  it("rejects buy() before the ICO.", function(done){
    subject.buy({value: web3.toWei(1, "ether"), from: accounts[0]}, function(errors) {
      if(errors) {
        done();
      }
    });
  });

  it("rejects buy() when ICO is opened, msg.sender == contractOwner.", function(done){
    utils.passBlocks(9, function() {
      subject.buy({value: web3.toWei(1, "ether"), from: accounts[0], gas: 200000}, function(errors) {
        if(errors) {
          done();
        }
      });
    });
  });

  it("accepts buy() when ICO is opened.", function(done){
    subject.buy({value: web3.toWei(1, "ether"), from: accounts[1], gas: 200000}, function(errors) {
      if(!errors) {
        done();
      }
    });
  });

  it("gives the right amount of ether during premium ICO period", function(done){
    subject.balanceOf(accounts[1], function(error, value) {
      if(value == web3.toWei(550, "ether")) { done(); }
    });
  });

  it("keeps track of ICO status correctly", function(done){
    subject.icoOverview(function(error, value) {
      if( value[0] == web3.toWei(1, "ether") &&
          value[1] == web3.toWei(550, "ether") &&
          value[2] == '91666666666666666666') {
        done();
      }
    });
  });

  it("gives the right amount of ether during normal ICO period.", function(done){
    utils.passBlocks(21, function() {
      subject.buy({value: web3.toWei(1, "ether"), from: accounts[2], gas: 200000}, function(errors) {
        if(!errors) {
          subject.balanceOf(accounts[2], function(error, value) {
            if(value == web3.toWei(500, "ether")) { done(); }
          });
        }
      });
    });
  });

  it("prevents withdraw() during the ICO period.", function(done) {
    subject.withdraw(web3.toWei(1, "ether"), {from: accounts[0], gas: 200000}, function(errors) {
      if(errors) {
        done();
      }
    });
  });

  it("prevents refill() during the ICO period.", function(done) {
    subject.refill({from: accounts[1], gas: 200000}, function(errors) {
      if(errors) {
        done();
      }
    });
  });

  it("proceeds transfers correctly.", function(done) {
    subject.transfer(accounts[2], web3.toWei(100, "ether"), {from: accounts[1], gas: 200000}, function(errors) {
      if(!errors) {
        subject.balanceOf(accounts[2], function(errors, account_2_ballance) {
          if(account_2_ballance == web3.toWei(600, "ether")) {
            subject.balanceOf(accounts[1], function(errors, account_1_ballance) {
              if(account_1_ballance == web3.toWei(450, "ether")) {
                done();
              }
            });
          }
        });
      }
    });
  });

  it("rejects transfers superior to balance correctly.", function(done) {
    subject.transfer(accounts[2], web3.toWei(1000, "ether"), {from: accounts[1], gas: 200000}, function(errors) {
      if(!errors) {
        subject.balanceOf(accounts[2], function(errors, account_2_ballance) {
          if(account_2_ballance == web3.toWei(600, "ether")) {
            subject.balanceOf(accounts[1], function(errors, account_1_ballance) {
              if(account_1_ballance == web3.toWei(450, "ether")) {
                done();
              }
            });
          }
        });
      }
    });
  });

  it("rejects transfers from contractOwner", function(done) {
    subject.transfer(accounts[2], web3.toWei(100, "ether"), {from: accounts[0], gas: 200000}, function(errors) {
      if(errors) {
        done();
      }
    });
  });

  it("rejects transfers to contractOwner", function(done) {
    subject.transfer(accounts[0], web3.toWei(100, "ether"), {from: accounts[1], gas: 200000}, function(errors) {
      if(errors) {
        done();
      }
    });
  });

  it("creates allowances correctly", function(done){
    subject.approve(accounts[1], web3.toWei(1, "ether"), {from: accounts[2], gas: 200000}, function(errors) {
      if(!errors) {
        subject.allowance(accounts[2], accounts[1], function(errors, value) {
          if(value == web3.toWei(1, "ether")) { done(); }
        });
      }
    });
  });

  it("transfers using allowances", function(done) {
    subject.transferFrom(accounts[2], accounts[3], web3.toWei(1, "ether"), {from: accounts[1], gas: 200000}, function(errors) {
      if(!errors) {
        subject.balanceOf(accounts[3], function(errors, account_3_ballance) {
          if(account_3_ballance == web3.toWei(1, "ether")) {
            subject.balanceOf(accounts[2], function(errors, account_2_ballance) {
              if(account_2_ballance == web3.toWei(599, "ether")) {
                done();
              }
            });
          }
        });
      }
    });
  });

  context("ICO outcome", function() {

    before(function(done){
      web3.currentProvider.sendAsync({
        jsonrpc: "2.0",
        method: "evm_snapshot",
        id: 1
      }, function(err, result) {
        if(!err) {
          subject.buy({value: web3.toWei(31, "ether"), from: accounts[4], gas: 200000}, function(errors) {
            if(!errors) {
              utils.passBlocks(30, function() { done(); });
            }
          });
        }
      });
    });

    context("is success", function() {
      it("allows withdraw()", function(done){
        subject.withdraw(web3.toWei(1, "ether"), {from: accounts[0], gas: 200000}, function(errors) {
          if(!errors) {
            done();
          }
        });
      });

      it("refuses refill()", function(done){
        subject.refill({from: accounts[1], gas: 200000}, function(errors) {
          if(errors) {
            done();
          }
        });
      });

      context("date of balance sheet management", function(){
        it('shows the correct last reference block', function(done){
          subject.latestReferenceBlockNumber(function(errors, value) {
            if(value == 50) { done(); }
          });
        });

        it('registers balances in last reference block', function(done){
          subject.balanceOf(accounts[1], function(errors, initial_account_1_ballance) {
            subject.balanceOf(accounts[2], function(errors, initial_account_2_ballance) {
              subject.transfer(accounts[2], web3.toWei(100, "ether"), {from: accounts[1], gas: 200000}, function(errors) {
                if(!errors) {
                  subject.balanceAtBlock(accounts[2], 50, function(errors, account_2_ballance) {
                    if(account_2_ballance.equals(initial_account_2_ballance)) {
                      subject.balanceAtBlock(accounts[1], 50, function(errors, account_1_ballance) {
                        if(account_1_ballance.equals(initial_account_1_ballance)) {
                          done();
                        }
                      });
                    }
                  });
                }
              });
            });
          });
        });
      });
    });

    context("is failure", function() {
      before(function(done){
        web3.currentProvider.sendAsync({
          jsonrpc: "2.0",
          method: "evm_revert",
          id: 1,
          params: [1]
        }, function(err, result) {
          if(!err)
            utils.passBlocks(30, function() { done(); });
        });
      });

      it("refuses withdraw()", function(done){
        subject.withdraw(web3.toWei(1, "ether"), {from: accounts[0], gas: 200000}, function(errors) {
          if(errors) {
            done();
          }
        });
      });

      it("allows refill()", function(done){
        subject.refill({from: accounts[1], gas: 200000}, function(errors) {
          if(!errors) {
            done();
          }
        });
      });
    });
  })
});
