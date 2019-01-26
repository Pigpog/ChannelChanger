const Discord = require('discord.js');const client = new Discord.Client();
const jsonfile = require('jsonfile');
client.on('ready', () => {
	console.log('Ready!');
	client.user.setPresence({ game: { name: "!help", type: 0 } });
	for(var i=0;i<client.guilds.array().length;i++){
		console.log(client.guilds.array()[i].name+" id: "+client.guilds.array()[i].id)
    }
    setTimeout(scanAll,4000)
});
const tokens = require('./tokens.js');
client.login(tokens.bot_token);
var channels=require("./channels.json")
var noFlyList=["nogame","Spotify"]
var changes=false
var keys=[] //list of channel id's

function autosave() {
	if(!changes){
        setTimeout(save,30000);
        changes=true
    }
}

function save(){
    console.log("Auto-saving Database..")
    jsonfile.writeFile("./channels.json", channels, function (err) {
		if (err){
			console.log(err)
		}
	})
    keys=Object.keys(channels)
    changes=false
	console.log("Autosave Complete")
}

keys=Object.keys(channels)
function majority(array,userCount,majorityPercent){
    var items=new Object()
    for (var i = 0; i < array.length; i++){
        items[array[i]]=((items[array[i]] || 0)+1)
    }
    var majority=""
    var majorityNumber=0
    for(var key in items){
        if(items[key]>=majorityNumber){
            majority=key;
            majorityNumber=items[key]
        }
    }
    if((majorityNumber/userCount)>majorityPercent){
        return(majority)
    }else{
        return("nogame")
    }
}

function scanAll(){
    setTimeout(scanAll,keys.length*502)
    for(var i=0;i<keys.length;i++){
        setTimeout(scanOne,i*500,keys[i])
    }
}

function scanOne(channelId){
    var channel=client.channels.get(channelId);
    if(channel){
        if(channel.manageable){
            if(channel.members.firstKey()){
                var games = [];
                for(var i = 0; i < channel.members.array().length; i++){
                    if(!channel.members.array()[i].user.bot){
                        if(channel.members.array()[i].presence.game){
                            games.push(channel.members.array()[i].presence.game.name || "nogame");
                        }
                    }
                }
                var newTitle=majority(games,channel.members.array().length,channels[channelId][1] || 0.5)
                if(!noFlyList.includes(newTitle)){
                    if(channels[channelId][2]===1){
                        channel.setName(newTitle)
                    }else{
                        if(channels[channelId][3]===1){
                            channel.setName(channels[channelId][0]+" "+newTitle)
                        }else{
                            channel.setName(channels[channelId][0]+" - "+newTitle)
                        }
                    }
                }else{
                    channel.setName(channels[channelId][0])
                }
            }else{
                channel.setName(channels[channelId][0])
            }
        }
    }else{
        delete channels[channelId]
        console.log("Found deleted channel")
	autosave()
    }
}

client.on('voiceStateUpdate', (oldMember,newMember) => {
    if(oldMember.voiceChannel!==newMember.voiceChannel){
        if (oldMember.voiceChannel){
            if (channels[oldMember.voiceChannel.id]){
                scanOne(oldMember.voiceChannel.id)
            }
        }
        if (newMember.voiceChannel){
            if (channels[newMember.voiceChannel.id]){
                scanOne(newMember.voiceChannel.id)
            }
        }
    }
})

client.on('message', message =>{
	var messageL=message.content.toLowerCase()
	if (message.guild){
		if (messageL==="!addvc"){
            if(message.guild.me.hasPermission("MANAGE_CHANNELS")){
                if(message.member.hasPermission("MANAGE_CHANNELS")){
                    if (message.member.voiceChannel){
                        try{
                            if (!channels[message.member.voiceChannel.id]){
                                channels[message.member.voiceChannel.id]=[message.member.voiceChannel.name];
                                autosave()
                                message.reply("Successfully added `"+message.member.voiceChannel.name+"` to my list")
                            }else{
                                message.reply("`"+channels[message.member.voiceChannel.id][0]+"` is already on my list.")
                            }
                        }catch(err){
                            console.log(err)
                        }
                    }else{
                        message.reply("You must be in a voice channel to use this command.")
                    }
                }else{
                    message.reply("You need `manage_channels` permission to do this.")
                }
            }else{
                message.reply("I need `manage_channels` permission to do this.")
            }
        }
		else if (messageL==="!removevc"){
            if(message.guild.me.hasPermission("MANAGE_CHANNELS")){
                if(message.member.hasPermission("MANAGE_CHANNELS")){
                    if (message.member.voiceChannel){
                        try{
                            if (channels[message.member.voiceChannel.id]){
                                message.member.voiceChannel.setName(channels[message.member.voiceChannel.id][0])
                                delete channels[message.member.voiceChannel.id];
                                autosave()
                                message.reply("Successfully removed `"+message.member.voiceChannel.name+"` from my list.")
                            }else{
                                message.reply("`"+message.member.voiceChannel.name+"` was not on my list.")
                            }
                        }catch(err){
                            console.log(err)
                        }
                    }else{
                        message.reply("You must be in a voice channel to use this command!")
                    }
                }else{
                    message.reply("You need `manage_channels` permission to do this.")
                }
            }else{
                message.reply("I need `manage_channels` permission to do this.")
            }
        }
        else if (messageL==="!gameonly"){
            if(message.member.hasPermission("MANAGE_CHANNELS")){
                if(message.member.voiceChannel){
                    if(channels[message.member.voiceChannelID]){
                        if(channels[message.member.voiceChannelID][2]){
                            delete channels[message.member.voiceChannelID][2]
                            message.reply("Game only is now off for `"+channels[message.member.voiceChannelID][0]+"`.")
                        }else{
                            channels[message.member.voiceChannelID][2]=1
                            message.reply("Only the game will be displayed for `"+channels[message.member.voiceChannelID][0]+"`. ")
                        }
                        autosave()
                    }else{
                        message.reply("Please run `!addvc` first.")
                    }
                }else{
                    message.reply("You must be in a voice channel to use this command.")
                }
            }else{
                message.reply("You need `manage_channels` permission to do this.")
            }
        }else if (messageL==="!showhyphen"){
            if(message.member.hasPermission("MANAGE_CHANNELS")){
                if(message.member.voiceChannel){
                    if(channels[message.member.voiceChannelID]){
                        if(channels[message.member.voiceChannelID][3]){
                            delete channels[message.member.voiceChannelID][3]
                            message.reply("Hyphen will be shown in `"+channels[message.member.voiceChannelID][0]+"`.")
                        }else{
                            channels[message.member.voiceChannelID][3]=1
                            message.reply("Hyphen will no longer be shown in `"+channels[message.member.voiceChannelID][0]+"`. ")
                        }
                        autosave()
                    }else{
                        message.reply("Please run `!addvc` first.")
                    }
                }else{
                    message.reply("You must be in a voice channel to use this command.")
                }
            }else{
                message.reply("You need `manage_channels` permission to do this.")
            }
        }
        else if(messageL==="!majority"){
            message.reply("Invalid syntax. Example: `!majority 50`")
        }
        else if(messageL.indexOf("!majority ")===0){
            if(message.member.hasPermission("MANAGE_CHANNELS")){
                if(message.member.voiceChannel){
                    if(channels[message.member.voiceChannelID]){
                        var majority=parseInt(messageL.substr(10))
                        if(majority){
                            if(majority>0 && majority <101){
                                channels[message.member.voiceChannelID][1]=majority/100
                                message.reply("Set majority for channel `"+channels[message.member.voiceChannelID][0]+"` to "+majority)
                                autosave()
                            }else{
                                message.reply("Invalid input. Number must be between 1 and 100.")
                            }
                        }else{
                            message.reply("Invalid input.")
                        }
                    }else{
                        message.reply("Please run `!addvc` first.")
                    }
                }else{
                    message.reply("You must be in a voice channel to use this command!")
                }
            }else{
                message.reply("You need `manage_channels` permission to do this.")
            }
        }
		else if (messageL==="!help"){
			message.channel.send("__Channel Changer Help__\n*The purpose of Channel Changer is to add what game you're playing to your connected voice channel's name.*\n**!addvc**: Adds your voice channel to be renamed.\n**!removevc**: Removes your voice channel from the list.\n**!majority**: Sets what percentage of people have to be playing the same game for it to change the name. From 1-100.\n**!gameonly**: Voice channel name will be set to just the title of the game, not hyphenated.\n**!showhyphen**: Toggles showing the hyphen (`-`) between the voice channel name and the game title.")
		}
	}
})

client.on("guildCreate", guild=>{
	console.log(guild.name)
})

process.on('unhandledRejection', function (err) {
    
}); 
