# ChannelChanger
Discord bot that changes voice channel names based on what games people are playing in it
![Demonstration](https://github.com/Pigpog/ChannelChanger/raw/master/example.png)

## To Begin
Run `npm i` to install the dependencies and run start.js

## Commands
 - `!addvc`      Enables the bot for your connected voice channel.
 - `!channels` List all the effected channels
 - `!removevc`   Disables the bot for your connected voice channel.
 - `!majority`   Finds the most played game.
 - `!abbreviate "name" "shorten"` Abbreviate a game use quotes for both the game's name and the abbreviations
 - `!admin` List all the admin
 - `!addadmin @member` Adds a member that can use the bot
 - `!remadmin @member` Remove a member from using the bot

## Template
The bot uses RegEx to give the VoiceChannel a new name after finding the most played game. Example; "Lounge - CS:GO" in template for is "X - Y" X being the previous channel's name and Y being the game being played
 - `!settemplate` Sets the RegEx template. ex. `!settemplate X [Y]`
 - `!gettemplate` Gets the current RegEx template.

 ## Node modules:
  - [discord.js](https://www.npmjs.com/package/discord.js)
