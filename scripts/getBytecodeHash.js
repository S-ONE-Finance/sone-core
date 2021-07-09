const eth = require('ethereumjs-util');

const UniswapV2Pair = require('../build/contracts/UniswapV2Pair.json');

// Hash of the bytecode is fixed. Calculated with eth.keccak256():
var bytecodeHash = eth.keccak256(UniswapV2Pair.bytecode).toString('hex');

console.log(bytecodeHash);