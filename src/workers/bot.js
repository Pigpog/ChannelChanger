/**
 * Default Discord Bot based around this library.
 * @author devr2k
 * This is a Message-based interface every command it listens for is in a switch so it's easily organized if you're looking for a command provided in the readme just search for it
 * The function scan does everything that is needed when changing a channel, so if you don't like how the bot uses channel changer then change @funciton scan()
 */
const Discord = require('discord.js');
const client = new Discord.Client();
const index = require(__dirname + '/../index.js');
const changer = index.lib.changer;
const worker = require('./data.js');
const {
    whitelist,
    centralize
} = index.config.main;
const bot = {
    owner: ""
}
var log = (x) => {
    if (index.config.main.debug) console.log(x);
}


function auth(obj) {
    if (obj.guild) {
        let config = worker.get(obj.guild.id, true)
        switch (obj.constructor) {
            case Discord.VoiceChannel:
                if (whitelist.channels) {
                    return config.channels.has(obj.id)
                } else return true
                break;
            case Discord.GuildMember:
                if (whitelist.admin) {
                    if (!centralize.config) {
                        return config.admin.has(obj.id) || bot.owner == obj.id || obj.id == obj.guild.owner.id
                    } else return bot.owner == obj.id || config.admin.has(obj.id)
                } else return true
                break;
            default:
                return false
                break;
        }
    }
}

function scan(obj, callback) {
    if (obj.guild) {
        let config = worker.get((centralize.configs ? "0" : obj.guild.id), true);
        if (centralize.abbrevitions && !centralize.abbrevitions) config.abbrevitions = worker.get("0", true).abbrevitions;
        switch (obj.constructor) {
            case Discord.VoiceChannel:
                if (auth(obj)) {
                    changer.change(obj, config)
                        .then(channel => {
                            log(" - changed: " + channel.name);
                        })
                        .catch(callback);
                } else callback(new Error("VoiceChannel '" + obj.id + "' is not Whitelisted."))
                break;
            case Discord.GuildMember:
                if (obj.voiceChannel) scan(obj.voiceChannel, callback)
                break;
        }
    }
}

/**
 * @param {String} token
 * @param {Function<Error>} callback [For catching Errors]
 */
module.exports = (token, callback) => {
    client.login(token)
        .then(() => {
            console.log(" # Ready! ");
            worker.load();
            client.fetchApplication()
                .then(app => bot.owner += app.owner.id)
                .catch(callback)
            client.on('message', msg => {
                let prefix = msg.content.split(" ")[0].toLowerCase();
                let body = msg.content.substr(prefix.length + 1);
                let args = msg.content.split(" ");
                if (msg.guild) {
                    let config = worker.get(centralize.configs ? "0" : msg.guild.id, true);
                    // ADMIN COMMANDS
                    if (auth(msg.member)) {
                        log(" # Command Recieved \n - prefix: " + prefix + "\n - body: " + body + "\n - args: " + args)
                        if (msg.member.voiceChannel) {
                            switch (prefix) {
                                case "!addvc":
                                    worker.add(config.id, "channels", msg.member.voiceChannelID);
                                    msg.reply("Channel added");
                                    log(" # Whitelisted Channel \n - name: #" + msg.member.voiceChannel.name + "@" + msg.guild.name + "\n - id: " + msg.member.voiceChannelID);
                                    break;
                                case "!removevc":
                                    config.channels.delete(msg.member.voiceChannelID);
                                    worker.set(config.id, "channels", config.channels);
                                    msg.reply("Channel removed");
                                    log(" # Blacklisted Channel \n - name: #" + msg.member.voiceChannel.name + "@" + msg.guild.name + "\n - id: " + msg.member.voiceChannelID)
                                    break;
                                case "!test":
                                    scan(msg.member.voiceChannel, callback);
                                    msg.reply("Done");
                                    break;
                                case "!reset":
                                    changer.reset(msg.member.voiceChannel);
                                    msg.reply("Done");
                                    break;
                            }
                        }
                        switch (prefix) {
                            case "!help":
                                msg.reply({embed: index.storage.help})
                                break;
                            case "!shorten":
                                if ((!centralize.abbreviations ? (bot.owner == msg.author.id) : true)) {
                                    let abbreviated = msg.content.split('"');
                                    let name = abbreviated[1].toLowerCase();
                                    let shorten = abbreviated[3];
                                    let temp = new Map(config.abbreviations).set(name, shorten);
                                    log(" # Abbreviation added \n - name: " + name + "\n - shorten: " + shorten);
                                    worker.set(config.id, "abbreviations", Array.from(temp));
                                    msg.reply("Done. '" + name + "' -> '" + shorten + "'");
                                } else msg.reply("Sorry, abbreviations can only be added by owner.");
                                break;
                            case "!template":
                                if (body.length > 0) {
                                    if (body.includes("Y")) {
                                        worker.set(config.id, "template", body)
                                        log(" # Set Template \n - template: " + body)
                                        msg.reply("Template Set ```" + body + "```")
                                    } else msg.reply("template ```" + config.template + "```");
                                } else msg.reply("template ```" + config.template + "```");
                                break;
                            case "!addadmin":
                                if (msg.mentions.members.size > 0) {
                                    log(" # Adding admin")
                                    msg.mentions.members.forEach(member => {
                                        config.admin.add(member.id)
                                        log(" - admin: " + member.user.username + "@" + member.guild.name)
                                    });
                                    worker.set(config.id, "admin", config["admin"]);
                                    msg.reply("Done.")
                                } else msg.reply("Mention Members that you'd like to be admin")
                                break;
                            case "!removeadmin":
                                log(" # Removing admin")
                                if (msg.mentions.members.size > 0) {
                                    msg.mentions.members.forEach(member => {
                                        config.admin.delete(member.id)
                                        log(" - admin: " + member.user.username + "@" + member.guild.name)
                                    });
                                    worker.set(config.id, "admin", config["admin"]);
                                    msg.reply("Done")
                                } else msg.reply("Mention Members that you'd like to be removed")
                                break;
                            case "!majority":
                                if (body.length > 0) {
                                    if (!isNaN(body)) {
                                        log(" # Set majority \n - majority: " + parseInt(body))
                                        worker.set(config.id, "majority", parseInt(body))
                                        msg.reply("New majority set. `" + body + "`")
                                    } else msg.reply("Majority `" + config.majority + "`");
                                } else msg.reply("Majority `" + config.majority + "`");
                                break;
                        }
                    }

                    // BOT OWNER COMMANDS
                    if (bot.owner == msg.author.id) {
                        switch (prefix) {
                            case "!save":
                                worker.save();
                                msg.reply("Done.");
                                break;
                            case "!load":
                                worker.load();
                                msg.reply("Done.");
                                break;
                            case "!config":
                                let str = "{"
                                let i = 0
                                Object.keys(config).forEach(key => {
                                    i++
                                    str += "\n\t \"" + key + "\": " + (config[key] instanceof String ? "\"" + config[key] + "\"" : JSON.stringify(config[key]))
                                    if (i != Object.keys(config).length) str += "," 
                                })
                                str += "\n}"
                                msg.reply("Config ```json\n" + str + "```")
                        }
                    }
                }
            });
            client.on('voiceStateUpdate', (oldMember, newMember) => {
                if (oldMember.voiceChannelID != newMember.voiceChannelID) {
                    scan(oldMember, callback);
                    scan(newMember, callback);
                }
            });
            client.on('presenceUpdate', (oldMember, newMember) => {
                scan(oldMember, callback);
                scan(newMember, callback);
            });

            client.on('error', callback);

            process.on('SIGINT', () => {
                worker.save();
                changer.store();
                process.exit();
            });
        })
        .catch(callback)
}