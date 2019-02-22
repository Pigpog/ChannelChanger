module.exports = {
    "storage": {
        "abbreviations": require('./storage/abbreviations.json'),
        "admin": require('./storage/admin.json').admin,
        "channels": require('./storage/channels.json').channels,
        "config": require('./storage/config.json')
    },
    "util": {
        data: require("./util/data.js"),
        logger: require("./util/logger.js")
    },
    "lib": {
        changer: require('./changer.js')
    },
}
