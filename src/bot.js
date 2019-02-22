const Discord = require('discord.js');
const client = new Discord.Client();
const changer = require('./changer.js');
const {
    data,
    logger
} = require('./index.js').util;
const {
    abbreviations,
    admin,
    channels,
    config
} = require('./index.js').storage;
var log = logger("bot", "RED")
var storage = data(__dirname + "/storage/", true)
module.exports = (token, callback) => {
    client.login(token)
        .then(() => {
            changer.abbreviations = abbreviations
            log("abbreviations imported", abbreviations)
            client.on('message', msg => {
                if (!msg.content.includes(" ")) msg.content += " "
                let prefix = msg.content.split(" ")[0]
                let body = msg.content.substr(prefix.length)
                if (admin.length > 0 ? admin.includes(msg.author.id) : true) {
                switch(prefix.toLowerCase()) {
                    case "!abbreviate":
                        let args = body.split('"')
                        let abb = {
                            "name": args[1],
                            "shorten": args[3]
                        }
                        changer.shorten(abb.name, abb.shorten)
                        storage.set("abbreviations.json", changer.abbreviations)
                        break;
                    case "!settemplate":
                            if (body.includes("X") && body.includes("Y")) {
                                config.template = body
                                storage.set("config.json", config)
                            } else msg.reply("Missing capital " +  body.includes("X") ? "Y" : body.includes("Y") ? "X" : "X & Y" + " for template")
                        break;
                    case "!gettemplate":
                            msg.reply("Template: `" + config.template  + "`")
                        break;
                    case "!addadmin":
                        admin.push(msg.author.id)
                        storage.set("admin.json", {"admin": admin})
                        break;
                    case "!remadmin":
                        break;
                }
                if (msg.member.voiceChannel) {
                    switch(prefix.toLowerCase()) {
                        case "!addvc":
                            if (!channels.includes(msg.member.voiceChannelID)) {
                                channels.push(msg.member.voiceChannelID)
                                log("Added " + msg.member.voiceChannel.name)
                                storage.set("channels.json", {"channels": channels})
                                .catch(log)
                            }
                            break;
                        case "!removevc":
                            channels.splice(channels.indexOf(msg.member.voiceChannelID))
                            changer.reset(msg.member.voiceChannel, console.log)
                            log("Removed " + msg.member.voiceChannel.name)
                            storage.set("channels.json", {"channels": channels})
                            .catch(log)
                            break;
                        case "!majority":
                            let x = changer.majority(msg.member.voiceChannel, console.log)
                            msg.reply("The most game played is " + x.game + " with " + x.count + " amount of players")
                            break;
                        case "!test":
                            changer.change(msg.member.voiceChannel, config.template)
                            .catch(log)
                            break;
                        case "!reset":
                            changer.reset(msg.member.voiceChannel, error => msg.reply(error.message))
                            break;
                    }
                }
                }
            })
            client.on('voiceStateUpdate', (oldMember, newMember) => {
                if (channels.includes(oldMember.voiceChannelID)) {
                    changer.change(oldMember.voiceChannel)
                }
                if (channels.includes(newMember.voiceChannelID)) {
                    changer.change(newMember.voiceChannel)
                }
            })
        })
        .catch(callback)
}
