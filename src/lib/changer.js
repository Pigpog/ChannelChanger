const Discord = require('discord.js');
const Config = require('./Config.js');
const MostPlayed = require('./MostPlayed.js');
const changer = {
  names: new Map()
}

/**
 * @method getMostPlayed
 * @param {Discord.VoiceChannel} channel
 * @returns {MostPlayed}
 */
changer.mostPlayed = channel => {
  if (channel instanceof Discord.VoiceChannel) {
    return new MostPlayed(channel);
  } else throw new TypeError("Provided channel is not a VoiceChannel")
}

/**
 * @method change
 * @param {Discord.VoiceChannel} channel
 * @param {Config} config
 * @returns {Promise<Channel>}
 */
changer.change = (channel, config = new Config()) => {
  return new Promise((res, rej) => {
    if (channel instanceof Discord.VoiceChannel) {
      let mostPlayed = new MostPlayed(channel).mostPlayed;
      if (mostPlayed != undefined) {
        let shorten = new Map(config.abbreviations).get(mostPlayed.name.toLowerCase())
        if (!channel.name.includes(mostPlayed.name) && !channel.name.includes(shorten)) {
          if (mostPlayed.percent <= config.majority) {
            changer.names.set(channel.id, channel.name);
            let newName = config.template
              .replace(/(X)/, channel.name)
              .replace(/(Y)/, shorten ? shorten : mostPlayed.name)
            channel.setName(newName)
              .then(res)
              .catch(rej)
          } else rej(new Error("Majority not met, needed '" + config.majority + "', have '" + mostPlayed.percent + "'"));
        } else rej(new Error("Game already set"));
      } else {
        if (changer.names.get(channel.id)) {
          changer.reset(channel, rej);
        } else rej(new Error("Most played game not found"));
      }
    } else rej(new TypeError("Provided channel is not a VoiceChannel"));
  })
}


/**
 * @method reset
 * @param {Discord.VoiceChannel} channel
 * @param {Function<Error>} callback
 */
changer.reset = (channel, callback) => {
  let oldName = changer.names.get(channel.id);
  if (oldName) {
    channel.setName(oldName)
      .catch(callback)
  }
}

module.exports = changer;
