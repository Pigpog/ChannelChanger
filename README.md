# Channel Changer
**0.9.2:** Beta
## Commands
 - [x] `!test` Test a VoiceChannel
 - [x] `!reset` Reset a VoiceChannel
 - [x] `!addvc` Whitelist a VoiceChannel while in it
 - [ ] `!remvc` Blacklist a VoiceChannel while in it
 - [ ] `!addadmin @member` Add an admin
 - [ ] `!remadmin @member` Remove an admin
 - [x] `!settemplate String` Set the RegEx Template, see Template Guide below
 - [x] `!gettemplate` Get the RegEx Template
 - [x] `!majority Number` Set the majority needed to change the channel's name. If no number is provided it will reply with the current majority
 - [x] `!shorten "name" "new name"` Abbreviates a name

## Bot Owner Commands
 - [x] `!save` Save the configs
 - [x] `!load` Load the configs

### Template Guide
Channel Changer uses RegEx to replace the channel's name with the most played game. Take a VoiceChannel called "Lounge" with CS:GO players as an example. X is the channel's name, and Y is the game being played so "X - Y" will be "Lounge - CS:GO".
 - `X` Channel's name
 - `Y` Most played game

### Starting the Bot
`npm start`

### Invite the Bot!
[Coming soon]
