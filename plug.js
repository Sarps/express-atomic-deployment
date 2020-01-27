const fs = require('fs');
const {spawn} = require('child_process');
const isRunning = require('is-running');
const forward = require('http-forward');
const cd = require('chokidar');
const kill = require('kill-process');
const http = require('http');
const detect = require('detect-port');
require('dotenv').config();

let serverInfo = [];

const getServerInfo = () => {
    try {
        let data = fs.readFileSync("server.process", {encoding: 'UTF-8'});
        serverInfo = data.split(":");
    } catch (e) {
        serverInfo = [];
    }
};

const start = (port) => {
    return new Promise(((resolve, reject) => {
        const ops = process.env.SERVER_SCRIPT.split(" ").filter(a => a.length);
        const server = spawn(ops.shift(), [...ops, '--port', port], {
            detached: true,
        });
        server.stdout.on('data', (data) => {
            if (data.toString().trim() === process.env.SUCCESS_LOG) {
                getServerInfo();
                resolve();
            } else {
                console.log(`${data}`);
            }
        });
        server.stderr.on('data', (data) => {
            console.error(`${data}`);
            reject();
        });
        server.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            reject();
        });
    }));
};

const restart = async () => {
    try {
        let oldPid = serverInfo[0];
        await start(await randomPort());
        if (serverInfo[0] && isRunning(serverInfo[0])) await kill(oldPid);
    } catch (e) {}
};

const folderIsTouched = () => false;

const randomPort = async () => {
    let port = process.env.MIN_INTERNAL_PORT;
    do {
        try {
            let _port = await detect(port);
            if (port === _port) return port;
        } catch (e) {
        }
        port++;
    } while (port <= process.env.MAX_INTERNAL_PORT);
    throw 'No port available';
};

(function forwardPort() {
    http.createServer(function (req, res) {
        req.forward = {target: `${process.env.SCHEME}://${process.env.INTERNAL_HOST}:${serverInfo[1]}`};
        forward(req, res);
    }).listen(process.env.EXTERNAL_PORT, process.env.EXTERNAL_HOST);
})();

(async function main() {
    getServerInfo();
    try {
        if (serverInfo[0] === undefined || !isRunning(serverInfo[0])) {
            await start(await randomPort());
        } else if (folderIsTouched()) {
            await restart();
        }
    } catch (e) {}
    cd.watch(process.env.WATCH_FOLDER, {ignored: new RegExp(process.env.IGNORED), ignoreInitial: true,})
        .on('all', restart);
})();

