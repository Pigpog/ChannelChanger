use serenity::{
    async_trait,
    model::{
        channel::Message,
        gateway::Ready,
        prelude::{GuildId, ChannelId},
        voice::VoiceState,
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

use std::env;

async fn change_channel(ctx: &Context, channel_id: ChannelId) {
    match channel_id.to_channel(&ctx.http).await.unwrap().guild() {
        Some (guild) => {
            for member in guild.members(&ctx).await.unwrap() {
                println!("User: {:?}\nPresence: {:?}", member.user.name, guild.guild(&ctx).await.unwrap().presences);
            }
        },
        None => println!("Not a guild channel"),
    }
    println!("Changing channel {:?}", channel_id);
    if let Err(why) = channel_id.edit(&ctx.http, |c| c.name("test")).await {
        println!("Error: {}", why);
    }
}

#[group]
#[commands(help, addvc, rmvc, template, majority)]
struct General;

struct Handler;

#[async_trait]
impl EventHandler for Handler {
    async fn ready(&self, _: Context, ready: Ready) {
        println!("{} ready", ready.user.name);
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
                None => println!("No old ID"),
            },
            None => println!("No old"),
        }
        // Check your new channel
        match _new.channel_id {
            Some(channel_id) => { change_channel(&_ctx, channel_id).await; },
            None => println!("No new"),
        }
    }
}

#[tokio::main]
async fn main() {
    let framework = StandardFramework::new()
        .configure(|c| c.prefix("!")) // set the bot's prefix to "!"
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

    // start listening for events by starting a single shard
    if let Err(why) = client.start().await {
        println!("An error occurred while running the client: {:?}", why);
    }
}

#[command]
async fn addvc(ctx: &Context, msg: &Message) -> CommandResult {
    println!("{:?}", msg);
    msg.reply(ctx, "insert code to add voice channels").await?;
    Ok(())
}

#[command]
async fn rmvc(ctx: &Context, msg: &Message) -> CommandResult {
    msg.reply(ctx, "insert code to remove voice channels").await?;
    Ok(())
}

#[command]
async fn template(ctx: &Context, msg: &Message) -> CommandResult {
    msg.reply(ctx, "insert code to set template").await?;
    Ok(())
}

#[command]
async fn majority(ctx: &Context, msg: &Message) -> CommandResult {
    msg.reply(ctx, "insert code to change majority").await?;
    Ok(())
}

#[command]
async fn help(ctx: &Context, msg: &Message) -> CommandResult {
    msg.reply(ctx, "__Commands__\n**!addvc** - Set your current voice channel to be renamed\n**!removevc** - Your current voice channel will no longer be renamed").await?;
    Ok(())
}

