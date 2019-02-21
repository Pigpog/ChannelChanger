const Discord = require('discord.js');
const changer = {
    names: new Map(),
    template: require('./storage/config.json').template
}

/**
 * @method majority
 * @desc Finds the most played game of a VoiceChannel
 * @param {Discord.VoiceChannel} channel
 * @param {Function<Error>} callback
 * @returns {Object}
 */
changer.majority = (channel, callback) => {
    if (channel instanceof Discord.VoiceChannel) {
        if (channel.members.size != 0) {
            let games = {}
            let compared = []
            // Find all games being played
            channel.members.forEach(member => {
                if (member.presence.game) games[member.presence.game.name] = 0
            })
            // Count how many times that game is being played in the channel
            channel.members.forEach(member => {
                if (member.presence.game) games[member.presence.game.name] += 1
            })
            // Sort it
            Object.keys(games).forEach(key => {
                compared.push([games[key], key])
            })
            let sorted = compared.sort()
            return {
                "game": sorted[sorted.length - 1][1],
                "count": sorted[sorted.length - 1][0],
                "games": Object.keys(games)
            }
        } else callback(new Error("No members in this VoiceChannel.\n - ID: " + channel.id))

    } else callback(new Error("Channel provided is not a VoiceChannel."))
}

/**
 * @method change
 * @desc Changes the channel based on the most game played
 * @param {Discord.VoiceChannel} channel
 * @param {String} template
   - template must consist of a capital X & Y
   X: the channel's original name
   Y: the game being played
   example: "X - Y" will make "Lounge - CS:GO"
 * @returns {Promise<channel>}
 */
changer.change = (channel, template = changer.template) => {
    return new Promise((res, rej) => {
        let majority = changer.majority(channel, rej)
        console.log("Changing Channel: \n - name: " + channel.name + "\n - id: " + channel.id + "\n - majority: " + majority)
        if (majority != undefined) {
            changer.names.set(channel.id, channel.name)
            let newName = template
            .replace(/(X)/, channel.name)
            .replace(/(Y)/, majority.game)
            console.log(" - new Name: " + newName)
            channel.setName(newName)
            .then(res)
            .catch(rej)
        }
    })
}

/**
 * @method reset
 * @desc retrieved the channel's original name
 * @BUG: The map is temporary, so if the bot crashes it won't find the original name
 * @param {Discord.VoiceChannel} channel
 * @param {Function<Error>} callback
 */
changer.reset = (channel, callback) => {
        let name = changer.names.get(channel.id)
        if (name != undefined) {
            channel.setName(name)
            .catch(callback)
        } else new Error("Channel was never set to begin with.\n - ID: " + channel.id)
}

module.exports = changer
