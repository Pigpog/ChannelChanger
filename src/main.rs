/*
 * ChannelChanger Discord Bot
 * Copyright (C) 2021 Pigpog <7060603@hotmail.ca>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

use serenity::{
    async_trait,
    model::{
        channel::Message,
        gateway::Ready,
        prelude::{GuildId, ChannelId, ActivityType},
        voice::VoiceState,
        guild::Guild,
    },
    client::{
        Client,
        Context,
        EventHandler,
        bridge::gateway::GatewayIntents,
    },
    framework::standard::{
        StandardFramework,
        CommandResult,
        macros::{
            command,
            group
        },
    },
};

use std::{
    collections::HashMap,
    env,
};

mod database;
use database::Database;

#[group]
#[commands(server, channel, category, invite, help)]

struct General;

struct Handler;

async fn change_channel(ctx: &Context, channel_id: ChannelId) {
    let new_name: String;
    let mut old_name: String = String::new();
    let mut games: HashMap<String, usize> = HashMap::new();
    // Get the GuildChannel of channel_id
    match channel_id.to_channel(&ctx.http).await.unwrap().guild() {
        Some (gchannel) => {
            old_name = gchannel.name.clone();
            // Contains presences of all guild members
            let presences = gchannel.guild(&ctx).await.unwrap().presences;
            for member in gchannel.members(&ctx).await.unwrap() {
                match presences.get(&member.user.id) {
                    Some(presence) => {
                        for activity in &presence.activities {
                            if activity.kind == ActivityType::Playing {
                                println!("{} is playing {:?}", member.user.name, activity.name);
                                // Increase the count for this game
                                *games.entry(activity.name.clone()).or_default() += 1;
                            }
                        }
                    },
                    None => {},
                }
            }
        },
        None => {},
    }

    println!("Vector contents: {:?}", &games);

    match games.into_iter().max_by_key(|(_, v)| *v).map(|(k, _)| k) {
        Some(major) => {
            // Set channel name to game
            println!("Majority: {}", major);
            new_name = major;
        }, 
        None => {
            // Reset channel name
            new_name = String::from("test");
        },
    }

    // We don't need to change the name
    if new_name == old_name {
        return;
    }

    println!("Changing channel {} -> {}", old_name, new_name);

    if let Err(why) = channel_id.edit(&ctx.http, |c| c.name(new_name)).await {
        println!("Error: {}", why);
    }
}

#[async_trait]
impl EventHandler for Handler {
    async fn ready(&self, _: Context, ready: Ready) {
        println!("{} ready", ready.user.name);
    }

    async fn guild_create(&self, _ctx: Context, _guild: Guild, _is_new: bool) {
        if _is_new {
            let data = _ctx.data.read().await;
            match data.get::<Database>() {
                Some(conn) => database::add_guild(conn, _guild.id.to_string()),
                None => {},
            }
        }
    }

    async fn voice_state_update(&self, _ctx: Context, _: Option<GuildId>, _old: Option<VoiceState>, _new: VoiceState) {
        // The way this function is ordered is important
        // because of my (lazy?) use of return
        match _new.member {
            // Ignore events about bot users
            Some(member) => if member.user.bot {
                println!("Ignoring bot");
                return;
            },
            None => println!("Somehow didnt have a member"),
        }
        // Check your old channel
        match _old {
            Some(old) => match old.channel_id {
                Some(channel_id) => {
                    // Ignore deafen/mute
                    if _new.channel_id.is_some() && old.channel_id == _new.channel_id {
                        return;
                    }
                    change_channel(&_ctx, channel_id).await;
                },
                None => {},
            },
            None => {},
        }
        // Check your new channel
        match _new.channel_id {
            Some(channel_id) => { change_channel(&_ctx, channel_id).await; },
            None => {},
        }
    }
}

#[tokio::main]
async fn main() {
    println!("ChannelChanger Copyright (C) 2021 Pigpog");
    println!("This program comes with ABSOLUTELY NO WARRANTY;");
    println!("This is free software, and you are welcome to");
    println!("redistribute it under certain conditions;");
    
    let framework = StandardFramework::new()
        // set the bot's prefix
        .configure(|c| c.prefix("!")) 
        .group(&GENERAL_GROUP);
    
    // Login with a bot token from the environment
    let token = env::var("DISCORD_TOKEN").expect("token");
    let mut client = Client::builder(token)
        .event_handler(Handler)
        .framework(framework)
        .intents({
            let mut intents = GatewayIntents::GUILD_PRESENCES;
            intents.set(GatewayIntents::GUILD_VOICE_STATES, true);
            intents.set(GatewayIntents::GUILD_MESSAGES, true);
            intents.set(GatewayIntents::GUILDS, true);
            intents
        })
        .await
        .expect("Error creating client");
    
    // Initialize the database
    match database::init() {
        Ok(conn) => {
            println!("Connected to database");
            // Store the database connection in the client
            client.data.write().await.insert::<Database>(conn);
        },
        Err(_) => panic!("Failed to initialize database."),
    }

// start listening for events by starting a single shard
    if let Err(why) = client.start().await {
        println!("An error occurred while running the client: {:?}", why);
    }
}

#[command]
async fn server(ctx: &Context, msg: &Message) -> CommandResult {
    msg.reply(ctx, "add code to modify server settings").await?;
    // just debugging for now
    match msg.guild_id {
        Some(gid) => {
            let data = ctx.data.read().await;
            match data.get::<Database>() {
                Some(conn) => database::add_guild(conn, gid.to_string()),
                None => {},
            }
        },
        None => {},
    }
   Ok(())
}

#[command]
async fn channel(ctx: &Context, msg: &Message) -> CommandResult {
    msg.reply(ctx, "add code to modify channel settings").await?;
    Ok(())
}

#[command]
async fn category(ctx: &Context, msg: &Message) -> CommandResult {
    msg.reply(ctx, "add code to modify category settings").await?;
    Ok(())
}

#[command]
async fn invite(ctx: &Context, msg: &Message) -> CommandResult {
    msg.reply(ctx, "https://discordapp.com/oauth2/authorize?client_id=854460666861977621&scope=bot&permissions=16").await?;
    Ok(())
}

#[command]
async fn help(ctx: &Context, msg: &Message) -> CommandResult {
    msg.reply(ctx, "__Commands__\n\
              **!channel** - Change settings for your current voice channel\n\
              **!category** - Change settings for your current voice channel's category\n\
              **!server** - Set default settings for the server\n\
              **!invite** - Get the invite link for this bot\n\
              __Subcommands__\n\
              **enable** - Enables ChannelChanger for your current voice channel/category\n\
              **disable** - Disables ChannelChanger for your current voice channel/category\n\
              **template** - Sets the pattern to use for channel names. Default: `X - Y`\
    ").await?;
    Ok(())
}

