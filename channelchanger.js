const Discord = require('discord.js');
const jsonfile = require('jsonfile');
const tokens = require('./tokens.js');
var channels=require("./channels.json");

const client = new Discord.Client({
	messageCacheMaxSize:1
});

// dont set the channel name to these
var noFlyList=[undefined,"Spotify", "Custom Status"];
//whether or not there have been unsaved changes made to the database
var changes=false; 

client.on('ready', () => {
	console.log('Logged in as ' + client.user.username);
	updatePresence();
	// Log some statistics
	console.log("Guilds: " + client.guilds.size);
	// count managed channels
	console.log("Channels in database: " + Object.keys(channels).length); 
	if(process.argv[2] === "prune"){
		prune();
	}
});

client.login(tokens.bot_token);

function prune() {
    var deleted = 0;
    console.log("Pruning database...");
    for(var channel in channels){
        if(!client.channels.get(channel)){
            delete channels[channel];
            deleted++;
            autosave();
        }
    }
    console.log("Deleted "+deleted+" channels.");
}

function updatePresence(){
	client.user.setPresence({ game: { name: "!help - Changing Channels", type: 0 } });
}

/**
* Called when changes are made to the database.
* Instead of saving immediately every time changes are made,
* this function limits the saves to every 30000ms.
*/
function autosave() {
	if(!changes){
		setTimeout(save,30000);
		changes=true;
	}
}
/**
* Saves the database. See autosave().
*/
function save(){
	console.log("Auto-saving Database..");
	jsonfile.writeFile("./channels.json", channels, function (err) {
		if (err){
			console.log(err);
		}
	})
	changes=false;
	console.log("Autosave Complete");
}

/**
* Determines what most people in the vc are playing
* @param channel the voice channel to calculate the majority game in
* @param majorityPercent the `!majority` value for the channel, as a decimal
* @return The title of the majority game
*/
function majority(channel,majorityPercent) {
	// title : count
	var games = {};
	// after sorting, this is the most played game title
	var majorityName = "";
	// after sorting, this is how many users are playing it 
	var majorityNumber = 0;
	// Number of non-bot users
	var userCount = 0;

	channel.members.forEach(function(member) {
		if(!member.user.bot) { // ignore bots
			userCount++;
			if(member.presence.activities.length > 0){
				var gameName = member.presence.activities[member.presence.activities.length-1].toString();
				if(gameName) {
					games[gameName] = ((games[gameName] || 0) + 1);
					if(games[gameName] > majorityNumber) {
						majorityName = gameName;
						majorityNumber = games[gameName];
					}
				}
			}
		}
	})
	if((majorityNumber / userCount) > majorityPercent){ // if we have a majority over the threshold
		return(majorityName);
	}else{
		return;
	}
}
/**Checks and sets the name of a voice channel.
* @param channel the voice channel in question.
*/
function scanOne(channel){
	var channelConfig=channels[channel.id]; // channel settings
	if(channel){
		if(channel.manageable){ //if the bot has permission to change the name
			var newTitle=channelConfig[0];
			if(channel.members.size>0){ // if anyone is in the channel
				var gameTitle=majority(channel, channelConfig[1] || 0.5);
				if(!noFlyList.includes(gameTitle)){
					if(channelConfig[2]){ //Template setting
						try{
							newTitle=(channelConfig[2].replace(/X/,channelConfig[0]).replace(/Y/,gameTitle));
						}catch(e){
							console.log(channel.id + "\007");
						}
					}else{ // use default
						newTitle=(channelConfig[0] + " - " + gameTitle);
					}
				}
			}
			if(channel.name!==newTitle){
				channel.setName(newTitle);
			}
		}
	}else{
		delete channels[channel.id];
		console.log("Found deleted channel");
		autosave();
	}
}
//update affected channels when someone leaves or joins
client.on('voiceStateUpdate', (oldVoiceState, newVoiceState) => {
	if(oldVoiceState.channelID !== newVoiceState.channelID){ // dont respond to mute/deafen
		if (oldVoiceState.channelID){
			if (channels[oldVoiceState.channelID]){
				scanOne(oldVoiceState.channel);
			}
		}
		if (newVoiceState.channelID){
			if (channels[newVoiceState.channelID]){
				scanOne(newVoiceState.channel);
			}
		}
	}
});

client.on('presenceUpdate', (oldPresence, newPresence) => {
	if(newPresence.member.voice.channelID){
		if(channels[newPresence.member.voice.channelID]){ // if their voice channel is managed by the bot
			scanOne(newPresence.member.voice.channel);
		}
	}
});

client.on('message', message =>{
	if(message.guild){
		if(message.content[0]==="!"){
			var messageL=message.content.toLowerCase()
			if (messageL === "!invite") {
				message.reply("https://discordapp.com/oauth2/authorize?client_id=376545537870266369&scope=bot&permissions=16");
			}else if (messageL==="!addvc"){
				if(message.member.hasPermission("MANAGE_CHANNELS")){
					if (message.member.voice.channelID){
						var voiceChannel=message.member.voice.channel;
						if(voiceChannel.manageable){
							if (!channels[voiceChannel.id]){
								channels[voiceChannel.id]=[voiceChannel.name, 0.5, "X - Y"];
								autosave()
								message.reply("Successfully added `"+voiceChannel.name+"` to my list")
								scanOne(voiceChannel)
								//updatePresence();
							}else{
								message.reply("`"+channels[voiceChannel.id][0]+"` is already on my list.")
							}
						}else{
							message.reply("I need `manage_channels` permission to do this.")
						}
					}else{
						message.reply("You must be in a voice channel to use this command.")
					}
				}else{
					message.reply("You need `manage_channels` permission to do this.")
				}
			}else if(messageL==="!removevc"){
				if(message.member.hasPermission("MANAGE_CHANNELS")){
					if (message.member.voice.channel){
						var voiceChannel=message.member.voice.channel;
						if (channels[voiceChannel.id]){
							if(voiceChannel.manageable){
								voiceChannel.setName(channels[voiceChannel.id][0])
							}
							delete channels[voiceChannel.id];
							autosave();
							//updatePresence();
							message.reply("Successfully removed `"+voiceChannel.name+"` from my list.");
						}else{
							message.reply("`"+voiceChannel.name+"` was not on my list.");
						}
					}else{
						message.reply("You must be in a voice channel to use this command!");
					}
				}else{
					message.reply("You need `manage_channels` permission to do this.");
				}
			}else if(messageL==="!template"){
				if(message.member.voice.channel){
					if(channels[message.member.voice.channelID]){
						message.reply("Template for `"+channels[message.member.voice.channelID][0]+"` is `"+channels[message.member.voice.channelID][2]+"`");
					}
				}
			}else if(messageL.indexOf("!template ")===0) {
				if(message.member.hasPermission("MANAGE_CHANNELS")) {
					if(message.member.voice.channel) {
						if(channels[message.member.voice.channelID]) {
							var newTemplate=message.content.substr(10).trim();
							if(newTemplate.length < 100) {
								if(newTemplate.includes("Y")) {
									channels[message.member.voice.channelID][2] = newTemplate;
									message.reply("The template for `" + channels[message.member.voice.channelID][0] + "` is now "+newTemplate);
									scanOne(message.member.voice.channel);
									autosave();
								}else{
									message.reply("The template must include `Y`.");
								}
							}else{
								message.reply("The template must be less than 100 characters long.");
							}
						}else{
							message.reply("Please run `!addvc` first.");
						}
					}else{
						message.reply("You must be in a voice channel to use this command.");
					}
				}else{
					message.reply("You need `manage_channels` permission to do this.");
				}
			}else if(messageL==="!majority") {
				if(message.member.voice.channel) {
					if(channels[message.member.voice.channelID]) {
						message.reply("Majority for `"+channels[message.member.voice.channelID][0]+"`: "+channels[message.member.voice.channelID][1]*100+"%");
					}
				}
			}else if(messageL.indexOf("!majority ")===0) {
				if(message.member.hasPermission("MANAGE_CHANNELS")) {
					if(message.member.voice.channelID) {
						if(channels[message.member.voice.channelID]) {
							var majority = parseInt(messageL.substr(10));
							if(majority > 0 && majority < 100) {
								channels[message.member.voice.channelID][1] = majority / 100;
								message.reply("Set majority for channel `"+channels[message.member.voice.channelID][0]+"` to "+majority+"%");
								scanOne(message.member.voice.channel);
								autosave();
							}else{
								message.reply("Invalid input. Number must be between 1 and 99.");
							}
						}else{
							message.reply("Please run `!addvc` first.");
						}
					}else{
						message.reply("You must be in a voice channel to use this command!");
					}
				}else{
					message.reply("You need `manage_channels` permission to do this.");
				}
			}else if (messageL==="!help"){
				message.channel.send("__Channel Changer Help__\n*The purpose of Channel Changer is to add what game you're playing to your connected voice channel's name.*\n**!addvc**: Adds your voice channel to be renamed.\n**!removevc**: Removes your voice channel from the list.\n**!majority**: Sets what percentage of people have to be playing the same game for it to change the name. From 1-100.\n**!template**: Sets the template. Default: `!template X - Y`. 'X' represents the original channel name, and 'Y' represents the majority game. If no new template is provided it will reply with the currently set template.\n**!invite**: Get the link to invite the bot.");
			}
		}
	}
})

client.on("guildCreate", guild=>{
	console.log("Joined "+guild.name);
	//updatePresence();
})

client.on("guildDelete", guild => {
	console.log("Left "+guild.name);
	updatePresence();
	prune();
})

// I am a nihilist
process.on('unhandledRejection', function (err) {

});
