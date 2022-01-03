# ChannelChanger
Discord bot that automatically updates voice channel names based on what games people are playing in it.

Add the bot to your server:
[First instance (full)](https://discordapp.com/oauth2/authorize?client_id=376545537870266369&scope=bot&permissions=16) |
[Second instance](https://discordapp.com/oauth2/authorize?client_id=764169534226694147&scope=bot&permissions=16) |
[Third instance](https://discordapp.com/oauth2/authorize?client_id=815686117122506842&scope=bot&permissions=16) | 
[Testing instance (Rust)](https://discordapp.com/oauth2/authorize?client_id=923438987786485791&scope=bot&permissions=268435472)

If you're wondering why there are multiple instances, it is because unverified bots
can't join more than 100 servers. Discord's verification process requires developers
to submit [legal photo identification](https://support.discord.com/hc/en-us/articles/1500006788922-Bot-Verification-FAQ-for-Parents-Legal-Guardians-and-Other-Sponsors).
This is something I will not stand for.


[Join our Discord server!](https://discord.gg/ExPdGsW)

![Demonstration](https://github.com/Pigpog/ChannelChanger/raw/master/example.png)

## Commands
`!addvc`      Enables the bot for your connected voice channel.

`!removevc`   Disables the bot for your connected voice channel.

`!majority`   Sets what percentage of people have to be playing the same game for it to change the name. From 1-100.

`!template` Sets the template. Default: `!template X - Y`. 'X' represents the original channel name, and 'Y' represents the majority game. If no new template is provided it will reply with the currently set template.

## Usage
(Note: You and the bot need Manage Channels permission)
 - [Invite the bot to your server](https://discordapp.com/oauth2/authorize?client_id=815686117122506842&scope=bot&permissions=16)
 - Join a voice channel
 - Send !addvc to a channel that the bot can see on the same server
 
 ### If you are running your own Channel Changer, add your token to `tokens.json`
 
 ## Node modules:
  - [discord.js](https://www.npmjs.com/package/discord.js)
  - [jsonfile](https://www.npmjs.com/package/jsonfile)
