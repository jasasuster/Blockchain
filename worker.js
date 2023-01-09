const {parentPort, workerData} = require('worker_threads');
const Block = require('./block.js');
var rand = Math.floor(Math.random() * 1000) + 1;

parentPort.on('message', (data) => {
    //console.log(`worker received: ${JSON.stringify(data)}`);
    var prevBlock = data.block;
    var difficulty = data.difficulty;

    var block = new Block(prevBlock.index+1, "test"+rand, Date.now().toString());

    block.previousHash = prevBlock.hash;
    //console.log(`new block: ${JSON.stringify(block)}`);
    block.mine(difficulty);
    //console.log("new hash:" + block.hash);

    //vrnemo minan block - nov hash
    parentPort.postMessage({block: block});
});