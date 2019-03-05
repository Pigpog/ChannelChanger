/**
 * Default Discord Bot based around this library.
 * @author devr2k
 * This is a Message-based interface every command it listens for is in a switch so it's easily organized if you're looking for a command provided in the README just search for it
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
                    return config.channels.includes(obj.id)
                } else return true
                break;
            case Discord.GuildMember:
                if (whitelist.admin) {
                    if (!centralize.config) {
                        return config.admin.has(msg.author.id) || bot.owner == msg.author.id || msg.author.id == msg.guild.owner.id
                    } else return bot.owner == msg.author.id || config.admin.has(msg.author.id)
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
                        if (msg.member.voiceChannel) {
                            switch (prefix) {
                                case "!addvc":
                                    worker.add(config.id, "channels", msg.member.voiceChannelID);
                                    msg.reply("Channel added");
                                    log(" # Whitelisted Channel \n - name: #" + msg.member.voiceChannel.name + "@" + msg.guild.name + "\n - id: " + msg.member.voiceChannelID);
                                    break;
                                case "!remvc":
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
                            case "!shorten":
                                if ((!centralize.abbreviations ? (bot.owner == msg.author.id) : true)) {
                                    let abbreviated = msg.content.split('"');
                                    let name = abbreviated[1].toLowerCase();
                                    let shorten = abbreviated[3];
                                    let temp = new Map(config.abbreviations).set(name, shorten);
                                    log(" # Abbreviation added \n - name: " + name + "\n - shorten: " + shorten);
                                    worker.set(config.id, "abbreviations", Array.from(temp));
                                    msg.reply("Done.");
                                } else msg.reply("Sorry, abbreviations can only be added by owner.");
                                break;
                            case "!template":
                                if (body.length > 0) {
                                    if (body.includes("Y")) {
                                        worker.set(config.id, "template", body)
                                        log(" # Set Template \n - template: " + body)
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
                                }
                                break;
                            case "!remadmin":
                                log(" # Removing admin")
                                if (msg.mentions.members.size > 0) {
                                    msg.mentions.members.forEach(member => {
                                        config.admin.delete(member.id)
                                        log(" - admin: " + member.user.username + "@" + member.guild.name)
                                    });
                                    worker.set(config.id, "admin", config["admin"]);
                                }
                                break;
                            case "!majority":
                                if (body.length > 0) {
                                    if (!isNaN(body)) {
                                        log(" # Set majority \n - majority: " + parseInt(body))
                                        msg.reply("New majority set. `" + body + "`")
                                        worker.set(config.id, "majority", parseInt(body))
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
                                msg.reply("Config " + JSON.stringify(config))
                        }
                    }
                }
            })
            client.on('voiceStateUpdate', (oldMember, newMember) => {
                if (oldMember.voiceChannelID != newMember.voiceChannelID) {
                    scan(oldMember, callback);
                    scan(newMember, callback);
                }
            })
            client.on('presenceUpdate', (oldMember, newMember) => {
                scan(oldMember, callback);
                scan(newMember, callback);
            })
            process.on('SIGINT', () => {
                worker.save();
                changer.store();
                process.exit();
            });
        })
        .catch(callback)
}