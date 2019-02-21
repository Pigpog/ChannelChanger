# ChannelChanger
Discord bot that changes voice channel names based on what games people are playing in it
![Demonstration](https://github.com/Pigpog/ChannelChanger/raw/master/example.png)

## Commands
 - `!addvc`      Enables the bot for your connected voice channel.
 - `!removevc`   Disables the bot for your connected voice channel.
 - `!majority`   Finds the most played game.

### Template
The bot uses RegEx to give the VoiceChannel a new name after finding the most played game. Example; "Lounge - CS:GO" in template for is "X - Y" X being the previous channel's name and Y being the game being played
 - `!settemplate` Sets the RegEx template. ex. `!settemplate X [Y]`
 - `!gettemplate` Gets the current RegEx template.


## Setup
(Note: You and the bot need Manage Channels permission)
 - [Invite the bot to your server](https://discordapp.com/oauth2/authorize?client_id=376545537870266369&scope=bot&permissions=16)
 - Join a voice channel
 - Send !addvc to a channel that the bot can see on the same server.
 
 
 ## Node modules:
  - [discord.js](https://www.npmjs.com/package/discord.js)
