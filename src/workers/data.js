/**
 * Central Data Management script
 * @author devr2k
 * This script manages all the Configs generated for each Guild that the bot is in. Here are the functions
  - @method get, get's a Config based on id provided it also can make a config if the second parameter provided is true.
  - @method set, set's a Config's property based on the property and data provided
  - @method add, like set just adds data like to an Array or String, Number, etc.
  - @method save, writes all the cached Configs to the directory
  - @method load, loads all the Configs into worker.guilds 
 */
const index = require(__dirname + '/../index.js');
const {
    centralize
} = index.config.main
const fs = require('fs');
const GuildConfig = require('./GuildConfig.js');
const worker = {
    dir: index.storage.guilds,
    guilds: new Map()
}

/**
 * @method get
 * Gets a Config
 * @param {String} id
 * @param {Boolean} make [Make one if it doesn't exist]
 * @returns {GuildConfig}
 */
worker.get = (id, make = false) => {
    let config = worker.guilds.get(id)
    if (config) {
        return config
    } else {
        if (fs.existsSync(worker.dir + id + ".json")) {
            let config = fs.readFileSync(worker.dir + id + ".json");
            try {
                return JSON.parse(config);
            } catch (err) {
                console.log(err);
                return undefined
            }
        } else if (make) return new GuildConfig(id);
    }
}

/**
 * @method set
 * Sets a Config's property
 * @param {String} id
 * @param {String} property
 * @param {a} data
 */
worker.set = (id, property, data) => {
    let config = worker.get(id, true);
    if (Object.keys(config).includes(property)) {
        config[property] = data;
    }
    worker.guilds.set(id, config);
}

/**
 * @method set
 * Adds a Config's property like an Array, String, Number, etc.
 * @param {String} id
 * @param {String} property
 * @param {a} data
 */
worker.add = (id, property, data) => {
    let config = worker.get(id, true);
    if (Object.keys(config).includes(property)) {
        if (typeof config[property][Symbol.iterator] === 'function') {
            if (config[property] instanceof Set) {
                config[property].add(data);
            }
            if (config[property] instanceof Array) {
                config[property].push(data);
            }
        } else {
            config[property] += data
        }
    }
    worker.guilds.set(id, config);
}

/**
 * @method save
 * Writes all the Configs to the dir
 */
worker.save = () => {
    if (!centralize.configs) {
        Array.from(worker.guilds).forEach(config => {
            if (config[1].id) {
                fs.writeFileSync(worker.dir + config[1].id + ".json", JSON.stringify(new GuildConfig(config[1].id, config[1]).JSONify()))
            }
        })
    } else fs.writeFileSync(worker.dir + "0.json", JSON.stringify(worker.get("0")));
}

/**
 * @method load
 * Caches all the Configs saved in the dir
 */
worker.load = () => {
    if (!centralize.configs) {
        fs.readdirSync(worker.dir).forEach(file => {
            try {
                let temp = fs.readFile(worker.dir + file, (err, data) => {
                    if (err) console.log(err.message)
                    else {
                        let config = JSON.parse(data)
                        worker.guilds.set(config.id, new GuildConfig(config.id, config));
                    }
                })
            } catch (err) {
                console.log(err.message)
            }
        })
    } else worker.guilds.set("0", JSON.parse(fs.readFileSync(worker.dir + "0.json")));
}

module.exports = worker;