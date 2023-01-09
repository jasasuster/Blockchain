const { parentPort } = require('worker_threads');
const interval = setInterval(function () {
    parentPort.postMessage('now');
}, 2000); //na 2s