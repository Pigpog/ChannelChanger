const readline = require('readline');
const bot = require('./src/workers/bot.js');
const fs = require('fs');
const index = require('./src/index.js');
var config = index.storage.bot;
var main = index.config.main

/**
 * Initial function
 */
function init() {
    bot(config.token, err => {
        if (main.debug) {
            console.log(err.message);
        }
        if (err.message.includes("token")) {
            build();
        }
    })
}

/**
 * Build script if init fails
 */
function build() {
    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question("Insert Token: ", ans => {
        if (ans != undefined && ans.length > 1) {
            rl.on('close', () => {
                config.token = ans
                fs.writeFile(__dirname + "/src/storage/bot.json", JSON.stringify(config), err => {
                    if (err) console.log("Error " + err.message);
                    else init();
                })
            })
            rl.close()
        }
    })
}

init()