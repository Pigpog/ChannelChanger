const Discord = require('discord.js');
const changer = require('./lib/changer.js');
const worker = require('./storage/worker.js');
const client = new Discord.Client();
var debugging = true
var owner = ""
var log = (x) => {
  if (debugging) console.log(x)
}

function scan(obj) {
  if (obj.guild) {
    let config = worker.get(obj.guild.id, true)
    switch (obj.constructor) {
      case Discord.VoiceChannel:
        log(" # Scanning Channel \n - name: #" + obj.name + "@" + obj.guild.name)
        if (config.channels.has(obj.id)) {
          changer.change(obj, config)
            .then(channel => {
              log(" - changed: " + channel.name);
            })
            .catch(err => {
              log(" - error: " + err.message);
            })
        } else log(" - error: VoiceChannel is not whitelisted")
        break;
      case Discord.GuildMember:
        log(" # Scanning Member \n - name: " + obj.user.username + "@" + obj.guild.name)
        if (obj.voiceChannel) {
          let voice = obj.voiceChannel
          if (config.channels.has(voice.id)) {
            changer.change(voice, config)
              .then((channel) => {
                log(" - changed: " + channel.name);
              })
              .catch(err => {
                log(" - error: " + err.message)
              })
          } else log(" - error: VoiceChannel not whitelisted '" + voice.id + "'")
        } else log(" - error: Not in a VoiceChannel")
        break;
    }
  }
}

module.exports = (token, callback) => {
  worker.load();
  client.login(token)
    .then(() => {
      client.fetchApplication()
        .then(app => owner += app.owner.id)
        .catch(callback)
      client.on('message', msg => {
        let prefix = msg.content.split(" ")[0].toLowerCase()
        let body = msg.content.substr(prefix.length + 1)
        let args = msg.content.split(" ")
        if (msg.guild) {
          let config = worker.get(msg.guild.id, true)

          // ADMIN COMMANDS
          if (config.admin.has(msg.author.id) || owner == msg.author.id || msg.author.id == msg.guild.owner.id) {
            if (msg.member.voiceChannel) {
              switch (prefix) {
                case "!addvc":
                  worker.add(msg.guild.id, "channels", msg.member.voiceChannelID)
                  log(" # Whitelisted Channel \n - name: #" + msg.member.voiceChannel.name + "@" + msg.guild.name + "\n - id: " + msg.member.voiceChannelID)
                  break;
                case "!remvc":
                  config.channels.delete(msg.member.voiceChannelID)
                  worker.set(msg.guild.id, "channels", config.channels)
                  log(" # Blacklisted Channel \n - name: #" + msg.member.voiceChannel.name + "@" + msg.guild.name + "\n - id: " + msg.member.voiceChannelID)
                  break;
                case "!test":
                  changer.change(msg.member.voiceChannel)
                  break;
                case "!reset":
                  changer.reset(msg.member.voiceChannel)
                  break;
              }
            }
            switch (prefix) {
              case "!shorten":
                let abbreviated = msg.content.split('"');
                let name = abbreviated[1].toLowerCase();
                let shorten = abbreviated[3];
                let temp = new Map(config.abbreviations).set(name, shorten);
                log(" # Abbreviation added \n - name: " + name + "\n - shorten: " + shorten);
                worker.set(msg.guild.id, "abbreviations", Array.from(temp));
                msg.reply("Done.");
                break;
              case "!template":
              if (body.length > 0)  {
                if (body.includes("X") || body.includes("Y")) {
                  worker.set(msg.guild.id, "template", body)
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
                  worker.set(msg.guild.id, "admin", config["admin"]);
                }
                break;
              case "!remadmin":
                log(" # Removing admin")
                if (msg.mentions.members.size > 0) {
                  msg.mentions.members.forEach(member => {
                    config.admin.delete(member.id)
                    log(" - admin: " + member.user.username + "@" + member.guild.name)
                  });
                  worker.set(msg.guild.id, "admin", config["admin"]);
                }
                break;
              case "!majority":
                if (body.length > 0) {
                  if (!isNaN(body)) {
                    log(" # Set majority \n - majority: " + parseInt(body))
                    worker.set(msg.guild.id, "majority", parseInt(body))
                  } else msg.reply("Majority `" + config.majority + "`");
                } else msg.reply("Majority `" + config.majority + "`");
                break;
            }
          }

          // BOT OWNER COMMANDS
          if (owner == msg.author.id) {
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
          if (oldMember.voiceChannel) scan(oldMember);
          if (newMember.voiceChannel) scan(newMember);
        }
      })
      client.on('presenceUpdate', (oldMember, newMember) => {
        if (oldMember.voiceChannel) scan(oldMember);
        if (newMember.voiceChannel) scan(newMember);
      })
      process.on('SIGINT', () => {
        worker.save()
        process.exit()
      });
    })
    .catch(callback)
}
