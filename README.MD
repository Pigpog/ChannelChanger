# ChannelChanger
Discord bot that automatically updates voice channel names based on what games people are playing in it.

---
<p xmlns:dct="http://purl.org/dc/terms/" xmlns:vcard="http://www.w3.org/2001/vcard-rdf/3.0#">
  <a rel="license"
     href="http://creativecommons.org/publicdomain/zero/1.0/">
    <img src="http://i.creativecommons.org/p/zero/1.0/88x31.png" style="border-style: none;" alt="CC0" />
  </a>
  <br />
  To the extent possible under law,
  <a rel="dct:publisher"
     href="https://github.com/Pigpog">
    <span property="dct:title">Pigpog</span></a>
  has waived all copyright and related or neighboring rights to
  <span property="dct:title">ChannelChanger</span>.
This work is published from:
<span property="vcard:Country" datatype="dct:ISO3166"
      content="CA" about="https://github.com/Pigpog">
  Canada</span>.
</p>

---

### This project has been discontinued and the following bot users are expected to be terminated in October 2022

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
 - The bot will now automatically rename that voice channel to what game you're playing!
 

## Self-Hosting 
 
### 1. Clone this repository

```
git clone https://github.com/Pigpog/ChannelChanger.git
```

### 2. Get the dependencies

In the ChannelChanger folder, run `npm i` to fetch the dependencies:

```
cd ChannelChanger
npm i
```

### If you don't have a bot token...

Visit the [Discord Developer Portal](https://discord.com/developers/applications) and create a new application.
Then head to the Bot section of the application, and create your bot user.
Click the Reset Token button and copy the generated token (about 60 characters long) for the next step.
Don't share this token with anyone!

### 3. Give the bot Intents

In your bot's Discord Application settings page, go to the Bot section and enable the Presence Intent, the Server Members Intent, and the Message Content Intent. 
These are required for the bot to access the data it needs to function.

### 4. Put your bot user's token in tokens.json

Open the tokens.json file in a text editor.
Remove the placeholder text that says `Your token here`, and paste your token between the two quotation marks.
Save the file.

### 5. Start the bot!

Start the bot by running this command in the ChannelChanger project folder:

```
node channelchanger.js
```

It should show how many channels are in the database and how many servers the bot user is in.

This is the command to run every time you want to start the bot.
