use serenity::{
    async_trait,
    model::{
        channel::Message,
        gateway::Ready,
        prelude::{GuildId, ChannelId},
        voice::VoiceState,
    },
    client::{Client, Context, EventHandler},
    framework::standard::{
        StandardFramework,
        CommandResult,
        macros::{
            command,
            group
        },
    },
};
//use serenity::client::{Client, Context, EventHandler};
use std::env;

fn change_channel(channel_id: ChannelId) {
    println!("Pretending to change channel {}", channel_id);
}

#[group]
#[commands(addvc, rmvc)]
struct General;

struct Handler;

#[async_trait]
impl EventHandler for Handler {
    async fn ready(&self, _: Context, ready: Ready) {
        println!("{} ready", ready.user.name);
    }

    async fn voice_state_update(&self, _ctx: Context, _: Option<GuildId>, _old: Option<VoiceState>, _new: VoiceState) { 
        // Ignore events about bot users
        match _new.member {
            Some(member) => if member.user.bot {
                println!("Ignoring bot");
                return;
            },
            None => println!("Somehow didnt have a member"),
        }
        match _old {
            Some(old) => match old.channel_id {
                Some(channel_id) => {
                    if _new.channel_id.is_some() {
                        // Ignore if ID didnt change
                        if old.channel_id == _new.channel_id {
                            return;
                        }
                    }
                    change_channel(channel_id)
                },
                None => println!("No old ID"),
            },
            None => println!("No old"),
        }

        match _new.channel_id {
            Some(channel_id) => change_channel(channel_id),
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
