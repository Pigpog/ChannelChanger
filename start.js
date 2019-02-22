const readline = require('readline');
const bot = require('./src/bot.js');
const {
    data
} = require('./src/index.js').util
const log = console.log
const {
    config
} = require('./src/index.js').storage
const storage = data(__dirname + "/src/storage/", true)
/**
 * Initial function
 */
function init() {
    bot(config.token, err => {
        if (err) {
            log(err.message)
            build()
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
                storage.set("config.json", config)
                .then(() => init())
                .catch(err => {
                    log("Error " + err.message)
                    build()
                })
            })
            rl.close()
        }
    })
}

init()
