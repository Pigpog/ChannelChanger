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
        prelude::{
            GuildId,
            ChannelId,
            UserId,
            ActivityType,
            PresenceUpdateEvent
        },
        voice::VoiceState,
        guild::{Guild, GuildUnavailable},
    },
    client::{
        Client,
        Context,
        EventHandler,
        bridge::gateway::GatewayIntents,
    },
    framework::standard::{
        StandardFramework,
        CommandError,
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
#[commands(enable, disable, template, invite, help)]

struct General;

struct Handler;

async fn change_channel(ctx: &Context, channel_id: ChannelId) {
    let data = ctx.data.read().await;
    let conn = data.get::<Database>().unwrap();
    let template;
    let old_name;
    let new_name: String;
    // Current name of the voice channel
    let mut curr_name: String = String::new();
    let mut games: HashMap<String, usize> = HashMap::new();

    match database::get_channel(conn, channel_id.to_string()) {
        Ok((name, templ)) => {
            println!("Original name: {}", name);
            old_name = name;
            template = templ.unwrap_or(String::from("X - Y"));
            println!("Template: {}", template);

        },
        Err(e) => {
            println!("Error: {}", e);
            return;
        },
    };

    // Get the GuildChannel of channel_id
    match channel_id.to_channel(&ctx.http).await.unwrap().guild() {
        Some (gchannel) => {
            curr_name = gchannel.name.clone();
            // Contains presences of all guild members
            let presences = gchannel.guild(&ctx).await.unwrap().presences;
            for member in gchannel.members(&ctx).await.unwrap() {
                let presence = presences.get(&member.user.id).unwrap();
                for activity in &presence.activities {
                    if activity.kind == ActivityType::Playing {
                        println!("{} is playing {:?}", member.user.name, activity.name);
                        // Increase the count for this game
                        *games.entry(activity.name.clone()).or_default() += 1;
                    }
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
            // TODO find a better way to do this
            new_name = template.replacen("X", &old_name, 1).replacen("Y", &major, 1);
        }, 
        None => {
            // Reset channel name
            new_name = old_name.clone();
        },
    }

    // We don't need to change the name
    if new_name == curr_name {
        return;
    }

    println!("Changing channel {} -> {}", curr_name, new_name);

    if let Err(why) = channel_id.edit(&ctx.http, |c| c.name(new_name)).await {
        println!("Error: {}", why);
    }
}

// retrieve the ID, name, and category ID of a user's voice channel, if any.
async fn get_vc_id(ctx: &Context, user_id: UserId, guild_id: GuildId) -> Option<(ChannelId, String, Option<ChannelId>)> {
    let guild = guild_id.to_guild_cached(&ctx.cache).await?;
    let (_key, vstate) = guild.voice_states.get_key_value(&user_id)?;
    let chan_id = vstate.channel_id?;
    let channel = chan_id.to_channel(&ctx).await.ok()?;
    return Some((chan_id, chan_id.name(&ctx.cache).await.unwrap().to_string(), channel.guild().unwrap().category_id));
}

// syncs the guilds db table with the guilds of the client user
async fn guild_check(ctx: &Context) {
    let data = ctx.data.read().await;
    let conn = data.get::<Database>().unwrap();
    // vector of guild ids in the database
    let mut db_guilds = database::get_all_guilds(conn).unwrap();
    // vector of guilds that the client user is in
    let cli_guilds = ctx.cache.guilds().await;

    // merely statistics
    let mut add_count = 0;
    let mut del_count = 0;

    println!("Guilds in database: {}", db_guilds.len());
    println!("Guilds from client: {}", cli_guilds.len());

    for i in 0..cli_guilds.len() {
        // index of this guild id if found in db_guilds
        let mut position = 0;
        // whether or not the guild id was found in db_guilds
        let mut found = false;

        // search for the cli_guild in db_guilds
        for j in 0..db_guilds.len() {
            if cli_guilds[i].to_string() == db_guilds[j] {
                position = j;
                found = true;
                break;
            }
        }

        if found {
            // remove the guild from the vector to avoid
            // deleting it from db in the next for loop
            db_guilds.remove(position);
        } else {
            // add this guild to the database
            database::add_guild(conn, cli_guilds[i].to_string());
            add_count = add_count + 1;
        }
    }

    // remove all of the remaining db_guilds from the db
    for guild in db_guilds {
        database::del_guild(conn, guild);
        del_count = del_count + 1;
    }

    println!("Added {} servers.", add_count);
    println!("Deleted {} servers.", del_count);
}

#[async_trait]
impl EventHandler for Handler {
    // when the client is ready
    async fn ready(&self, ctx: Context, ready: Ready) {
        println!("{} ready", ready.user.name);
        println!("Updating guilds table...");
        guild_check(&ctx).await;
    }
    // when the bot joins a server
    async fn guild_create(&self, _ctx: Context, _guild: Guild, _is_new: bool) {
        if _is_new {
            let data = _ctx.data.read().await;
            let conn = data.get::<Database>().unwrap();
             database::add_guild(conn, _guild.id.to_string());
        }
    }
    // when the bot leaves a server
    async fn guild_delete(&self, _ctx: Context, _incomplete: GuildUnavailable, _full: Option<Guild>) {
        let data = _ctx.data.read().await;
        let conn = data.get::<Database>().unwrap();
        database::del_guild(conn, _incomplete.id.to_string());
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
            Some(channel_id) => change_channel(&_ctx, channel_id).await,
            None => {},
        }
    }
    async fn presence_update(&self, ctx: Context, new_data: PresenceUpdateEvent) {
        match new_data.guild_id {
            Some(guild_id) => {
                println!("{}", guild_id);
                match get_vc_id(&ctx, new_data.presence.user_id, guild_id).await {
                    Some((vc_id, _vc_name, _cat_id)) => {
                        change_channel(&ctx, vc_id).await;
                    },
                    None => { println!("Could not resolve channel")},
                }
            },
            None => println!("No guild"),
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
        .configure(|c| c.prefix("!")) // set the bot's prefix
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
#[required_permissions(MANAGE_CHANNELS)]
async fn enable(ctx: &Context, msg: &Message) -> CommandResult {
    // ignore messages from bots
    if msg.author.bot { return Ok(()) };
    // ignore DMs
    if msg.guild_id.is_none() { return Ok(()); };

    let guild_id = msg.guild_id.unwrap();
    let args = msg.content.splitn(2, " ").collect::<Vec<_>>();

    if args.len() < 2 {
        msg.reply(ctx, "You must specify a subcommand").await?;
        return Err(CommandError::from("No subcommand specified"));
    };

    match get_vc_id(ctx, msg.author.id, msg.guild_id.unwrap()).await {
        Some((vc_id, vc_name, cat_id)) => {
            println!("{}", vc_id);
            let data = ctx.data.read().await;
            let conn = data.get::<Database>().unwrap();
            match args[1] {
                "channel" => {
                    match database::add_channel(conn, guild_id.to_string(), vc_id.to_string(), vc_name.clone()) {
                        Ok(_) => {
                            msg.reply(ctx, format!("Enabled changes for channel `{}`", vc_name)).await?;
                            change_channel(ctx, vc_id).await;
                        },
                        Err(e) => {
                            msg.reply(ctx, format!("Error: {}", e)).await?;
                        },
                    };
                },
                "category" => {
                    match cat_id {
                        Some(category_id) => {
                            match database::add_category(conn, guild_id.to_string(), category_id.to_string()) {
                                Ok(_) => {
                                    msg.reply(ctx, format!("Successfully enabled changes for category `{}`", vc_name)).await?;
                                    change_channel(ctx, vc_id).await;
                                },
                                Err(e) => {
                                    msg.reply(ctx, format!("Error: {}", e)).await?;
                                },
                            };
                        },
                        None => {
                            msg.reply(ctx, format!("{} is not in a category", vc_name)).await?;
                            return Err(CommandError::from("No category"));
                        },
                    }
                },
                &_ => {
                    msg.reply(ctx, "Invalid subcommand").await?;
                    return Err(CommandError::from("Invalid subcommand"));
                },
            }
        },
        None => {
            msg.reply(ctx, "You must be in a voice channel to use this command").await?;
        },
    }
    Ok(())
}

#[command]
#[required_permissions(MANAGE_CHANNELS)]
async fn disable(ctx: &Context, msg: &Message) -> CommandResult {
    let args = msg.content.splitn(2, " ").collect::<Vec<_>>();

    if args.len() < 2 {
        msg.reply(ctx, "You must specify a subcommand").await?;
        return Err(CommandError::from("No subcommand specified"));
    };

    match get_vc_id(ctx, msg.author.id, msg.guild_id.unwrap()).await {
        Some((vc_id, vc_name, cat_id)) => {
            let data = ctx.data.read().await;
            let conn = data.get::<Database>().unwrap();
            match args[1] {
                "channel" => {
                    match database::del_channel(conn, vc_id.to_string()) {
                        Ok(()) => {
                            msg.reply(ctx, format!("Disabled changes for channel {}", vc_name)).await?;
                        },
                        Err(e) => {
                            msg.reply(ctx, format!("An error occurred: {}", e)).await?;
                        }
                    }
                },
                "category" => {
                    match cat_id {
                        Some(category_id) => {
                            match database::del_category(conn, category_id.to_string()) {
                                Ok(_) => msg.reply(ctx, "Disabled changes for category").await?,
                                Err(e) => msg.reply(ctx, format!("Error: {}", e)).await?,
                            };
                        },
                        None => {
                            msg.reply(ctx, format!("{} is not in a category", vc_name)).await?;
                            return Err(CommandError::from("No category"));
                        },
                    }
                },
                &_ => {
                    msg.reply(ctx, "Invalid subcommand").await?;
                }
            }
        },
        None => {
            msg.reply(ctx, "You must be in a voice channel to use this command").await?;
        },
    }

    Ok(())

}


#[command]
#[required_permissions(MANAGE_CHANNELS)]
async fn template(ctx: &Context, msg: &Message) -> CommandResult {
    let args = msg.content.splitn(3, " ").collect::<Vec<_>>();

    if args.len() < 3 {
        msg.reply(ctx, "You must specify a subcommand and a template").await?;
        return Err(CommandError::from("No subcommand specified"));
    };

    match get_vc_id(ctx, msg.author.id, msg.guild_id.unwrap()).await {
        Some((vc_id, _vc_name, _cat_id)) => {
            let data = ctx.data.read().await;
            let conn = data.get::<Database>().unwrap();
            match args[1] {
                "channel" => {
                    match database::set_channel_template(conn, vc_id.to_string(), String::from(args[2])) {
                        Ok(()) => {
                            msg.reply(ctx, format!("Set channel template to `{}`", args[2])).await?;
                        },
                        Err(e) => {
                            msg.reply(ctx, format!("An error occurred: {}", e)).await?;
                        }
                    }
                },
                &_ => {
                    msg.reply(ctx, "Invalid subcommand. Valid subcommands are: `channel`, `category`").await?;
                }
            }
        },
        None => {
            msg.reply(ctx, "You must be in a voice channel to use this command").await?;
        },
    }

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
              **!enable** - Enables ChannelChanger for your current voice channel/category\n\
              **!disable** - Disables ChannelChanger for your current voice channel/category\n\
              **!template** - Sets the pattern to use for channel names. Default: `X - Y`\n\
              **!invite** - Get the invite link for this bot\n\
              __Subcommands__\n\
              **channel** - Apply changes to your current voice channel\n\
              **category** - Apply changes to your current voice channel's category\
    ").await?;
    Ok(())
}

