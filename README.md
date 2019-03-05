# Channel Changer
Discord bot that changes voice channel names based on what games people are playing in it
 [![example](./example.png)](https://discordapp.com/oauth2/authorize?client_id=551085114004602882&scope=bot&permissions=16)
 
## Commands
 - `!help` For a list of commands in Discord.
 - `!test` Test a VoiceChannel while in it
 - `!reset` Reset a VoiceChannel while in it
 - `!addvc` Whitelist a VoiceChannel while in it
 - `!remvc` Blacklist a VoiceChannel while in it
 - `!addadmin @member` Add an admin
 - `!remadmin @member` Remove an admin
 - `!template String` Set the RegEx Template, see Template Guide below. If no String is provided it will reply with the current template.
 - `!majority Number` Set the majority needed to change the channel's name. If no number is provided it will reply with the current majority
 - `!shorten "name" "new name"` Abbreviates a name

## Bot Owner Commands
 - `!save` Save the configs
 - `!load` Load the configs

### Template Guide
Channel Changer uses RegEx to replace the channel's name with the most played game. Take a VoiceChannel called "Lounge" with CS:GO players as an example. X is the channel's name, and Y is the game being played so "X - Y" will be "Lounge - CS:GO".
 - `X` Channel's name
 - `Y` Most played game

### Starting the Bot
`npm start`

### [Invite the Bot!](https://discordapp.com/oauth2/authorize?client_id=551085114004602882&scope=bot&permissions=16)
