module.exports = {
    "util": {
        data: require("./util/data.js"),
        logger: require("./util/logger.js")
    },
    "lib": {
        changer: require('./changer.js')
    },
    "storage": {
        abbreviations: require('./storage/abbreviations.json'),
        channels: require('./storage/channels.json'),
        config: require('./storage/config.json')
    }
}
