const fs = require('fs');
const GuildConfig = require('./GuildConfig.js');
const worker = {
    dir: __dirname + "/guilds/",
    guilds: new Map()
}

/**
 * @method get
 * Gets a config
 * @param {String} id
 * @param {Boolean} make [Make one if it doesn't exist]
 * @returns {GuildConfig}
 */
worker.get = (id, make = false) => {
    let config = worker.guilds.get(id)
    if (config) {
        return config
    } else if (make) {
        worker.guilds.set(id, new GuildConfig(id));
        return new GuildConfig(id);
    } else return undefined
}

worker.set = (id, property, data) => {
    let config = worker.get(id, true);
    if (Object.keys(config).includes(property)) {
        config[property] = data;
    }
    worker.guilds.set(id, config);
}

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

worker.save = () => {
    Array.from(worker.guilds).forEach(config => {
        if (config[1].id) {
            fs.writeFileSync(worker.dir + config[1].id + ".json", JSON.stringify(new GuildConfig(config[1].id, config[1]).JSONify()))
        }
    })
}

worker.load = () => {
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
}

module.exports = worker;
