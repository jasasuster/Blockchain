const crypto = require("crypto"), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");
const Block = require("./block.js");

function getHash(block) {
    return SHA256(block.index + block.timestamp + block.data + block.previousHash + block.nonce + block.difficulty);
}

class Blockchain {
    constructor() {
        this.chain = [new Block(0, "first block", Date.now().toString())];
        this.blocktime = 10000;
        this.difficulty = 1;
        this.diffAdjustInterval = 10;
    }

    getLastBlock() {
        //console.log(`chain length: ${this.chain.length}`);
        //console.log(`prev block: ${JSON.stringify(this.chain[this.chain.length - 1])}`);
        return this.chain[this.chain.length - 1];
    }

    getIndex() {
        return this.chain.length;
    }

    addBlock(block) {
        //console.log("works till here");
        console.log(`last block: ${JSON.stringify(this.getLastBlock())}`);
        block.previousHash = this.getLastBlock().hash;
        console.log(`prev hash: ${block.previousHash}`);
        //block.hash = block.getHash();
        //console.log(`Hash: ${hash}`);
        //block.mine(this.difficulty);
        var previousBlock = this.getLastBlock();

        //validiramo blok
        if (previousBlock.hash == block.previousHash && (previousBlock.index + 1) == block.index && block.hash == getHash(block) 
        && (Date.now() - parseInt(block.timestamp) < 60000 && (parseInt(previousBlock.timestamp) - parseInt(block.timestamp)) < 60000)) {
            this.chain.push(block);

            //če je chain dovolj dolg, preverimo ali lahko spremenimo težavnost
            if(this.chain.length > this.diffAdjustInterval + 1){    //po nekaj blokih spremenimo težavnost
                var previousAdjustmentBlock = this.chain[this.chain.length - this.diffAdjustInterval];
                var timeExpected = this.blocktime * this.diffAdjustInterval;
                var timeTaken = block.timestamp - previousAdjustmentBlock.timestamp;

                if (timeTaken < (timeExpected / 2)) {
                    this.difficulty++;
                } 
                else if (timeTaken > (timeExpected * 2)){
                    if(this.difficulty !== 1)
                        this.difficulty--;;
                }
                //this.diffAdjustInterval += 10;
            }
            this.counter++;
            return true;
        }
        return false;
    }
}

module.exports = Blockchain;