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
<<<<<<< HEAD
        "value": "Removes the VoiceChannel you're in from the whitelist."
=======
        "value": "Removes the VoiceChannel you're in from the whitelist"
>>>>>>> 622954a0a5c1efb0eff41d6e8b36e7beef632b36
    }, {
        "name": "!addadmin @member",
        "value": "Allows the member to operate the bot."
    }, {
        "name": "!removeadmin @member",
<<<<<<< HEAD
        "value": "Removes the member from operating the bot"
=======
        "value": "Removes the member from operating the bot."
>>>>>>> 622954a0a5c1efb0eff41d6e8b36e7beef632b36
    }, {
        "name": "!test",
        "value": "Tests Channel Changer with the VoiceChannel you're in."
    }, {
        "name": "!reset",
<<<<<<< HEAD
        "value": "Resets the VoiceChannel you're in, if it was changed."
    }, {
        "name": "!shorten \"old name\" \"new name\"",
        "value": "Abbreviates the old name provided into the new name."
=======
        "value": "Resets the VoiceChannel you're in if it was changed"
    }, {
        "name": "!shorten \"old name\" \"new name\"",
        "value": "Abbreviates the old name provided into the new name"
>>>>>>> 622954a0a5c1efb0eff41d6e8b36e7beef632b36
    }, {
        "name": "!template",
        "value": "Sets the template ex. `!template X - Y` if no new template if provided it will reply with the currently set template."
    }, {
        "name": "!majority X",
<<<<<<< HEAD
        "value": "Sets what percentage of people have to be playing the same game for it to change the name. Ex. `!majority 25`. If a new majority is not provided then it will reply with the current."
    }]
})
=======
        "value": "Sets the majority percentage needed to change the Channel's name, if X (number) isn't provided then it will reply with the currently set majority."
    }]
})
>>>>>>> 622954a0a5c1efb0eff41d6e8b36e7beef632b36
