# ChannelChanger - Rust Branch
In this branch, I will rewrite the bot in Rust. Note that this is my first time using Rust. You've been warned.

Discord bot that automatically updates voice channel names based on what games people are playing in it.

[Add the bot to your server!](https://discordapp.com/oauth2/authorize?client_id=815686117122506842&scope=bot&permissions=16)

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

## Compiling

Ensure that the Rust language is installed. If not, install it using your
distribution's package manager.

Clone this repository:

```
git clone https://github.com/Pigpog/ChannelChanger.git
```

Compile using cargo:

```
cd ChannelChanger

cargo build --release
```

## Hosting

Discord bots use login tokens.
You must create an application and bot user on the [Discord Applications page](https://discord.com/developers/applications).

### on GNU/Linux

Initialize the sqlite database:

```
sqlite -init sqlinit.txt channels.db
```

Once you have compiled the bot, you can run it using the following command:

```
DISCORD_TOKEN=YOUR_TOKEN_HERE DATABASE=channels.db cargo run
```

