# ChannelChanger
Discord bot that changes voice channel names based on what games people are playing in it

[Invite](https://discordapp.com/oauth2/authorize?client_id=376545537870266369&scope=bot&permissions=16)

![Demonstration](https://github.com/Pigpog/ChannelChanger/raw/master/example.png)

## Commands
`!addvc`      Enables the bot for your connected voice channel.

`!removevc`   Disables the bot for your connected voice channel.

`!majority`   Sets what percentage of people have to be playing the same game for it to change the name. From 1-100.

`!gameonly`   Voice channel name will be set to just the title of the game, not hyphenated.

`!showhyphen` Toggles showing the hyphen (`-`) between the voice channel name and the game title.

`!template` Sets the template. Ex: `!template X - Y`. If no new template if provided it will reply with the currently set template.

## Setup
(Note: You and the bot need Manage Channels permission)
 - [Invite the bot to your server](https://discordapp.com/oauth2/authorize?client_id=376545537870266369&scope=bot&permissions=16)
 - Join a voice channel
 - Send !addvc to a channel that the bot can see on the same server.
 
 ### If you are running your own Channel Changer, add your token to `tokens.json`
 
 ## Node modules:
  - [discord.js](https://www.npmjs.com/package/discord.js)
  - [jsonfile](https://www.npmjs.com/package/jsonfile)