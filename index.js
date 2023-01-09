const crypto = require('crypto'), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");
const { Worker, parentPort } = require('worker_threads');
const Block = require('./block.js');
const Blockchain = require('./blockchain.js');

var args = process.argv.slice(2);   //argumenti brez prvih dveh - nastane array
console.log(args);
const port = args[0];               //port za server
const p2p_port = args[1];           //port za p2p server

//server
const app = require('express')();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

//p2p server
var server_p2p_server = require('http').createServer();
var server_p2p_io = require('socket.io')(server_p2p_server);
var server_p2p = require('socket.io-p2p-server').Server;
server_p2p_io.use(server_p2p);
server_p2p_server.listen(p2p_port);

//p2p client
var p2p = require('socket.io-p2p');
var client_p2p_io = require('socket.io-client');
const { isObject } = require('util');

//blockchain
var MyChain = new Blockchain();

//izračunamo težavnost v verigi
function calculateDifficulty(blockchain) {
    var value = 0;
    blockchain.forEach(block => {
        value += Math.pow(2, block.difficulty);
    });
    return value;
}

//primerjamo težavnosti dveh verig in sprejmemo 
function compare(chainPrime, chainSecond){
    var valuePrime = calculateDifficulty(chainPrime);
    var valueSecond = calculateDifficulty(chainSecond);

    console.log(`first value: ${valuePrime}, second value: ${valueSecond}`)
    if(valuePrime < valueSecond){
        console.log("second chain");
        return true;
    }
    else {
        console.log("prime chain");
        return false;
    }
}

app.get('/', (req, res) => {    //website home
    res.sendFile(__dirname + '/index.html');    //naložimo index.html
});

//da lahko client dostopa do modulov
app.get('/socket.io.js', (req, res, next) => {
    return res.sendFile(__dirname + '/node_modules/socket.io-client/dist/socket.io.js');
});

app.get('/socket.io-file-client.js', (req, res, next) => {
    return res.sendFile(__dirname + '/node_modules/socket.io-file-client/socket.io-file-client.js');
});

io.on('connection', (socket) => {
    try{
        //MyChain.addBlock(new Block(MyChain.chain.length, "test", Date.now().toString(), ""));
        console.log(MyChain.chain);

        socket.on('mine', async (msg) => {
            try{                
                var blocktime = MyChain.blocktime;
                const worker = new Worker('./worker.js', {workerData: blocktime});
                console.log('created new worker');
                worker.postMessage({
                    block: MyChain.getLastBlock(),
                    difficulty: MyChain.difficulty
                });
                worker.on('message', async (data) => {
                    var block = data.block;
                    //console.log(`worker sent: ${JSON.stringify(data.block)}`);
                    if(MyChain.addBlock(block)){
                        io.emit('acceptMessage', "New block added<br>" + block.hash);
                        io.emit('acceptBlockMessage', block);
                    } else {
                        io.emit('rejectMessage', "New block rejected<br>" + block.hash);
                        io.emit('rejectBlockMessage', block);
                    }
                    worker.postMessage({
                        block: MyChain.getLastBlock(),
                        difficulty: MyChain.difficulty
                    })
                });
                worker.on('error', (msg) => { console.log(msg) });
                worker.on('exit', (code) => {
                    if (code !== 0)
                        console.log(code);
                });
            } catch (e) {
                console.log(`Error on socket mine: ${e}`);
            }
        });

        //p2p client
        socket.on('client', (msg) => {
            try{
                //connect
                var client_p2p_socket = client_p2p_io(`http://localhost:${msg}`);
                var client_p2p = new p2p(client_p2p_socket);

                client_p2p.emit('message', 'joined');                       

                client_p2p.on('response', (msg) => {
                    console.log(msg);
                });

                client_p2p.on('chain', function (newChain) {
                    console.log("New blockchain");
                    io.emit('message', "New blockchain");
                    if(compare(MyChain.chain, newChain)) {
                        MyChain.chain = newChain;
                        MyChain.difficulty = MyChain.getLastBlock().difficulty;
                        io.emit('message', 'New blockchain accepted');
                        io.emit('blockchain', MyChain.chain);
                    }
                    else {
                        io.emit('message', 'New blockchain rejected');
                    }
                })

                socket.on('disconnect', () => {
                    io.emit('message', 'User disconnected');
                    client_p2p_socket.disconnect();
                    client_p2p.disconnect();
                });

                
                socket.on('disconnect_p2p', function () {
                    socket.emit('message', 'A user disconnected');
                    c_p2p_socket.disconnect();
                    c_p2p.disconnect();
                });

            } catch (e) {
                console.log(`Error on socket p2p client: ${e}`);
            }            
        });

        //p2p server
        server_p2p_io.on('connection', (p2p_socket) => {
            try{
                socket.emit('message', 'Peer connected');
                console.log('Peer connected');

                var interval_worker = new Worker('./interval.js');
                interval_worker.on('message', () => {
                    console.log('chain sent');
                    p2p_socket.emit('response', "Connection successeful");
                    p2p_socket.emit('chain', MyChain.chain);
                });

                p2p_socket.on('message', (msg) => {
                    socket.emit('message', msg);
                    p2p_socket.emit('response', 'Successfully connected');
                });

                p2p_socket.on('disconnect', () => {
                    console.log('Peer disconnected');
                    socket.emit('message', 'Peer disconnected');
                });

            } catch (e) {
                console.log(`Error on server_p2p_io connection: ${e}`);
            }
        })

        socket.on('disconnect', () => {
            console.log("User disconnected");
            io.emit('message', 'User disconnected');
        });

    } catch (e) {
        console.log(`Error on io connection: ${e}`);
    }
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});