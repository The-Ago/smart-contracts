var assert = require('assert');
var async = require('async');
var fs = require('fs');
var solc = require('solc');
var Web3 = require('web3');

var TestRPC = require('ethereumjs-testrpc');
var web3 = new Web3();
web3.setProvider(TestRPC.provider());

function passBlocks(blockNumber, callback, current=0) {
  new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      method: "evm_mine",
      params: null,
      jsonrpc: "2.0",
      id: 1
    }, function(err, result) {
      current++;
      if(current==blockNumber) {
        callback()
      } else {
        passBlocks(blockNumber, callback, current);
      }
    });
  })
}

module.exports = {
	web3: web3,
  compileContract: (filenames, replaces) => {
    var sources = {};

    var source = fs.readFileSync('./contracts/' + filenames[0]).toString();
    replaces.forEach((replacement) => {
      source = source.replace(replacement[0], replacement[1]);
    });

    sources[filenames[0]] = source;
    delete filenames[0];

    filenames.forEach((filename) => {
      sources[filename] = fs.readFileSync('./contracts/' + filename).toString();
    });

  	var compiled = solc.compile({sources: sources}, 200);
  	assert.equal(compiled.errors, undefined, compiled.errors);
  	return compiled;
  },
  deployContract: function(account, compiled) {
    return new Promise((resolve, reject) => {
      web3.eth.contract(JSON.parse(compiled.interface)).new(
        {
          from: account,
          data: compiled.bytecode,
          gas: 4700000
        },
        function(err, contract) {
          if(!err) {
            if(contract.address) {
              resolve(contract);
            }
          } else {
            reject(err);
          }
        }
      );
    });
  },
  passBlocks: passBlocks
}
