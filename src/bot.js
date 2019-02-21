const Discord = require('discord.js');
const client = new Discord.Client();
const changer = require('./changer.js');
const {
    data,
    logger
} = require('./index.js').util;
const {
    config,
    channels
} = require('./index.js').storage;
var log = logger("bot", "RED")
var storage = data(__dirname + "/storage/", true)
module.exports = (token, callback) => {
    client.login(token)
        .then(() => {
            client.on('message', msg => {
                if (!msg.content.includes(" ")) msg.content += " "
                let prefix = msg.content.split(" ")[0]
                let body = msg.content.substr(prefix.length)
                if (msg.member.voiceChannel) {
                    switch(prefix.toLowerCase()) {
                        case "!addvc":
                            channels.push(msg.member.voiceChannelID)
                            storage.set("channels.json", {"channels": channels})
                            .catch(log)
                            break;
                        case "!removevc":
                            channels.splice(channels.indexOf(msg.member.voiceChannelID))
                            changer.reset(msg.member.voiceChannel, console.log)
                            storage.set("channels.json", {"channels": channels})
                            .catch(log)
                            break;
                        case "!majority":
                            let x = changer.majority(msg.member.voiceChannel, console.log)
                            msg.reply("The most game played is " + x.game + " with " + x.count + " amount of players")
                            break;
                        case "!settemplate":
                            if (body.includes("X") && body.includes("Y")) {
                                config.template = body
                                storage.set("config.json", config)
                            } else msg.reply("Missing capital " +  body.includes("X") ? "Y" : body.includes("Y") ? "X" : "X & Y" + " for template")
                            break;
                        case "!gettemplate":
                            msg.reply("Template: `" + config.template  + "`")
                            break
                        case "!test":
                            changer.change(msg.member.voiceChannel, config.template)
                            .catch(log)
                            break;
                        case "!reset":
                            changer.reset(msg.member.voiceChannel, error => msg.reply(error.message))
                            break;
                    }
                }
            })
        })
        .catch(callback)
}
