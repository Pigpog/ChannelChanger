/**
 * Channel changing scirpt
 * @author devr2k
 */
const Discord = require('discord.js');
const changer = {
    names: new Map(),
    abbreviations: {}
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
            return sorted.length != 0 ? {
                // The game name
                "game": sorted[sorted.length - 1][1],
                // Amount of players
                "count": sorted[sorted.length - 1][0],
                // Other games being played and counted
                "games": games
            } : undefined
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
changer.change = (channel, template = "X - Y") => {
    return new Promise((res, rej) => {
        let majority = changer.majority(channel, rej);
        if (majority != undefined && !channel.name.includes(majority.game)) {
            // Reset the channel, to prevent adding onto the name
            changer.reset(channel)
            // Save the channel name for resets
            changer.names.set(channel.id, channel.name)
            let abbreviated = changer.abbreviations[majority.game.toLowerCase()]
            let newName = template
            .replace(/(X)/, channel.name)
            .replace(/(Y)/, abbreviated ? abbreviated : majority.game)
            channel.setName(newName)
            .then(res)
            .catch(rej);
        } else if (majority == undefined) changer.reset(channel);
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
        }
}

/**
 * @method shorten
 * @desc Shorten a game's name (abbreviations)
 * @param {String} name
 * @param {String} shorten
 */
changer.shorten = (name, shorten) => {
    changer.abbreviations[name.toLowerCase()] = shorten
}

module.exports = changer
