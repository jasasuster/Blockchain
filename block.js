const crypto = require('crypto'), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");

class Block {
    constructor(index, data = "", timestamp = ""){
        this.index = index;
        this.data = data;
        this.timestamp = timestamp;
        this.difficulty = 1;
        this.nonce = 0;
        this.previousHash = "";
        this.hash = this.getHash();
    }

    getHash() {
        //console.log(`index: ${this.index}, timestamp: ${this.timestamp}, data: ${this.data}, previousHash: ${this.previousHash}`);
        return SHA256(this.index + this.timestamp + this.data + this.previousHash + this.nonce + this.difficulty);
    }

    getDifficulty() {
        //console.log(this.difficulty);
        return this.difficulty;
    }

    mine(difficulty){
        this.difficulty = difficulty;
        //console.log(`block: ${JSON.stringify(this)}`);
        while (this.hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")){
            this.nonce++;
            this.hash = this.getHash();
        }
    }
}

module.exports = Block;