const process = require('process');
const fs = require('fs');
const argv = require('yargs').argv;
require('dotenv').config();

const init = () => {
    if (!argv.port) throw 'Please provide port number';
    return {
        expose: () => {
            fs.writeFileSync(process.env.SERVER_LOG_FILE, `${process.pid}:${argv.port}:${Date.now()}`);
            console.log(process.env.SUCCESS_LOG);
        },
        port: argv.port
    }
};


module.exports = init;
