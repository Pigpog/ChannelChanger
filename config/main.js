module.exports = {
    "whitelist": {
        "channels": false,
        "admin": false
    },
    // If true, it will deny Guilds to have their own configs, and instead bot will use src/storage/guilds/0.json
    "centralize": {
        "configs": false,
        "abbreviations": false
    },
    "debug": false // if true it will log everything that is happening. Otherwise it will only log Errors
}