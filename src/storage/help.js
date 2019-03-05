// default help message (Discord.RichEmbed)
const {
    RichEmbed
} = require('discord.js');
module.exports = new RichEmbed({
    "title": "Channel Changer - Help",
    "description": "Some commands may not work according to how the preferences are setup.",
    "color": 4374779,
    "fields": [{
        "name": "!addvc",
        "value": "Whitelists the VoiceChannel you're in."
    }, {
        "name": "!removevc",
        "value": "Removes the VoiceChannel you're in from the whitelist."
    }, {
        "name": "!addadmin @member",
        "value": "Allows the member to operate the bot."
    }, {
        "name": "!removeadmin @member",
        "value": "Removes the member from operating the bot"
    }, {
        "name": "!test",
        "value": "Tests Channel Changer with the VoiceChannel you're in."
    }, {
        "name": "!reset",
        "value": "Resets the VoiceChannel you're in, if it was changed."
    }, {
        "name": "!shorten \"old name\" \"new name\"",
        "value": "Abbreviates the old name provided into the new name."
    }, {
        "name": "!template",
        "value": "Sets the template ex. `!template X - Y` if no new template if provided it will reply with the currently set template."
    }, {
        "name": "!majority X",
        "value": "Sets what percentage of people have to be playing the same game for it to change the name. Ex. `!majority 25`. If a new majority is not provided then it will reply with the current."
    }]
})
