const Discord = require('discord.js');const client = new Discord.Client();
const jsonfile = require('jsonfile');
client.on('ready', () => {
	console.log('Ready!');
	client.user.setPresence({ game: { name: "!help - Changing Channels", type: 0 } });
	//list connected guilds and their ID's
	client.guilds.forEach(guild=>{
		console.log(guild.name+" id: "+guild.id)	
	})
	setTimeout(scanAll,15000)
});
const tokens = require('./tokens.js');
client.login(tokens.bot_token);
var channels=require("./channels.json")
var noFlyList=["nogame","Spotify"] // dont set the channel name to these
var changes=false //whether or not there have been unsaved changes made to the database
var keys=Object.keys(channels) //list of channel id's
/*
* Called when changes are made to the database.
* Instead of saving immediately every time changes are made,
* this function limits the saves to every 30000ms.
*/
function autosave() {
	if(!changes){
		setTimeout(save,30000);
		changes=true
	}
}
/*
* Saves the database. See autosave().
*/
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

/*
* calculates returns what to set the channel name to
* channel: the voice channel to calculate the majority game in
* majorityPercent: the `!majority` value for the channel, as a decimal
*/
function majority(channel,majorityPercent){
	var games = {"nogame":0};
	var majorityName="";
	var majorityNumber=0;
	channel.members.forEach(function(member){
		if(!member.user.bot){ // ignore bots
			if(member.user.presence.game){
				games[member.presence.game.name]=(games[member.presence.game.name] || 0) + 1;
				if(games[member.presence.game.name]>majorityNumber){
					majorityName=member.presence.game.name;
					majorityNumber=games[member.presence.game.name];
				}
			}else{
				games["nogame"]+=1
			}
		}
	})
	if((majorityNumber / channel.members.size) > majorityPercent){
		return(majorityName)
	}else{
		return("nogame")
	}
}
// loops through each channel on the list and passes it to scanOne
function scanAll(){
	setTimeout(scanAll,keys.length*200) //timed loop
	for(var i=0;i<keys.length;i++){
		setTimeout(scanOne,i*200,keys[i]) //give each channel 200ms to complete
	}
}
// Checks and sets the name of a voice channel. The core functionality.
// channelId: the id of the voice channel in question.
function scanOne(channelId){
	var channel=client.channels.get(channelId);
	var channelConfig=[]
	if(channels[channelId]){ //Store the channel's settings in a variable to prevent crashes
		channelConfig=channels[channelId]
	}
	if(channel){
		if(channel.manageable){ //if the bot has permission to change the name
			if(channel.members.firstKey()){ // if anyone is in the channel
				var gameTitle=majority(channel, channelConfig[1] || 0.5)
				var newTitle=""
				if(!noFlyList.includes(gameTitle)){
					if(channelConfig[2]===1){  // "gameonly" archaic setting
						newTitle=(gameTitle)
					}else if(channelConfig[3]===1){ // "showhyphen" archaic setting
						newTitle=(channelConfig[0]+" "+gameTitle)
					}else if(channelConfig[2]){ //Template setting
						newTitle=(channelConfig[2].replace(/X/,channelConfig[0]).replace(/Y/,gameTitle))
					}else{
						newTitle=(channelConfig[0] + " - " + gameTitle)
					}
				}else{
					newTitle=(channelConfig[0]) // Set it back to normal
				}
				if(channel.name!==newTitle){
					channel.setName(newTitle)
				}
			}else{
				if(channel.name!==channelConfig[0]){
					newTitle=(channelConfig[0])
				}
			}
		}
	}else{
		delete channels[channelId]
		console.log("Found deleted channel")
		autosave()
	}
}
//update affected channels when someone leaves or joins
client.on('voiceStateUpdate', (oldMember,newMember) => {
	if(oldMember.voiceChannel!==newMember.voiceChannel){ // dont respond to mute/deafen
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
	if(message.guild){
		if(message.content[0]==="!"){  //peak efficiency
			var messageL=message.content.toLowerCase()
			if (messageL==="!addvc"){
				if(message.guild.me.hasPermission("MANAGE_CHANNELS")){
					if(message.member.hasPermission("MANAGE_CHANNELS")){
						if (message.member.voiceChannel){
							if (!channels[message.member.voiceChannel.id]){
								channels[message.member.voiceChannel.id]=[message.member.voiceChannel.name];
								autosave()
								message.reply("Successfully added `"+message.member.voiceChannel.name+"` to my list")
							}else{
								message.reply("`"+channels[message.member.voiceChannel.id][0]+"` is already on my list.")
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
			else if(messageL==="!removevc"){
				if(message.guild.me.hasPermission("MANAGE_CHANNELS")){
					if(message.member.hasPermission("MANAGE_CHANNELS")){
						if (message.member.voiceChannel){
							if (channels[message.member.voiceChannel.id]){
								message.member.voicenewTitle=(channels[message.member.voiceChannelID][0])
								delete channels[message.member.voiceChannelID];
								autosave()
								message.reply("Successfully removed `"+message.member.voiceChannel.name+"` from my list.")
							}else{
								message.reply("`"+message.member.voiceChannel.name+"` was not on my list.")
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
			else if(messageL==="!gameonly"){
				message.reply("`!gameonly` has been replaced with `!template`. Check `!help` for details.")
			}else if(messageL==="!template"){
				if(message.member.voiceChannel){
					if(channels[message.member.voiceChannelID]){
						message.reply("Template for `"+channels[message.member.voiceChannelID][0]+"` is `"+channels[message.member.voiceChannelID][2]+"`")
					}
				}
			}
			else if(messageL.indexOf("!template ")===0){
				if(message.member.hasPermission("MANAGE_CHANNELS")){
					if(message.member.voiceChannel){
						if(channels[message.member.voiceChannelID]){
							var newTemplate=message.content.substr(10).trim()
							if(newTemplate.length<100){
								if(newTemplate.includes("Y")){
									channels[message.member.voiceChannelID][2]=newTemplate
									delete channels[message.member.voiceChannelID][3] //Get rid of archaic stuff. Line not needed if using fresh database.
									message.reply("The template for `"+channels[message.member.voiceChannelID][0]+"` is now "+newTemplate)
									if(newTemplate.includes(message.member.voiceChannel.name)){
										message.channel.send("*Pro-tip: Use 'X' in your template in place of the channel name.*")
									}
									autosave()
								}else{
									message.reply("The template must include `Y`.")
								}
							}else{
								message.reply("The template must be less than 100 characters long.")
							}
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
			else if(messageL==="!showhyphen"){
				message.reply("`!showhyphen` has been replaced with `!template`. Check `!help` for details.")
			}
			else if(messageL==="!majority"){
				message.reply("Missing value. Example: `!majority 50`")
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
				message.channel.send("__Channel Changer Help__\n*The purpose of Channel Changer is to add what game you're playing to your connected voice channel's name.*\n**!addvc**: Adds your voice channel to be renamed.\n**!removevc**: Removes your voice channel from the list.\n**!majority**: Sets what percentage of people have to be playing the same game for it to change the name. From 1-100.\n**!template**: Sets the template. Default: `!template X - Y`. 'X' represents the original channel name, and 'Y' represents the majority game. If no new template is provided it will reply with the currently set template.")
			}
		}
	}
})

client.on("guildCreate", guild=>{
	console.log(guild.name)
})

process.on('unhandledRejection', function (err) {

});