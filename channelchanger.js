const {Client, Intents, Permissions} = require('discord.js');
const jsonfile = require('jsonfile');
const tokens = require('./tokens.js');
var channels=require("./channels.json");

const client = new Client({
	messageCacheMaxSize:1,

	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_PRESENCES,
		Intents.FLAGS.GUILD_VOICE_STATES
	]
});

// dont set the channel name to these
var noFlyList=[undefined, "Spotify", "Custom Status"];
//whether or not there have been unsaved changes made to the database
var changes=false; 

client.on('ready', () => {
	console.log('Logged in as ' + client.user.username);
	client.user.setPresence({ activities: [{ name: "!help - Changing Channels", status: 'online' }], status: 'online' });
	// Log some statistics
	console.log("Guilds: " + client.guilds.cache.size);
	// count managed channels
	console.log("Channels in database: " + Object.keys(channels).length); 
	if(process.argv[2] === "prune"){
		prune();
	}
});

client.login(tokens.bot_token);

function prune() {
// TODO: make this work again

/*    var deleted = 0;
    console.log("Pruning database...");
    for(var channel in channels){
        if(!client.channels.fetch(channel)){
            delete channels[channel];
            deleted++;
            autosave();
        }
    }
    console.log("Deleted "+deleted+" channels.");*/
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
			if(member.presence && member.presence.activities.length > 0){
				// Get the second-last activity, which avoids
				// using Custom Status as a game name.
				var gameName = member.presence.activities[member.presence.activities.length-1].toString();
				if(gameName) {
					// Tally the games up
					games[gameName] = ((games[gameName] || 0) + 1);
					if(games[gameName] > majorityNumber) {
						majorityName = gameName;
						majorityNumber = games[gameName];
					}
				}
			}
		}
	})
	// if we have a majority over the threshold
	if((majorityNumber / userCount) > majorityPercent){
		return(majorityName);
	} else {
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

/* Necessary permissions checks for commands to work.
 * Checks if the user is in a voice channel, has MANAGE_CHANNELS,
 * and that the bot has MANAGE_CHANNELS. If not, it replies with
 * an error.
 */
function commandChecks(message) {
	pass = true;
	if (!message.member.voice.channelId) {
		message.reply("You must be in a voice channel to use this command.");
		pass = false;
	} else {
		var voiceChannel=message.member.voice.channel;
		if(!message.member.permissionsIn(message.member.voice.channel).has(Permissions.FLAGS.MANAGE_CHANNELS)) {
			message.reply("You need `manage_channels` permission to do this.")
			pass = false;
		} else if (!voiceChannel.manageable) {
			message.reply("I need `manage_channels` permission to do this.")
			pass = false;
		}
	}
	return {pass: pass, vc: voiceChannel};
}

//update affected channels when someone leaves or joins
client.on('voiceStateUpdate', (oldVoiceState, newVoiceState) => {
	// dont respond to mute/deafen
	if(oldVoiceState.channelId !== newVoiceState.channelId){ 
		if (oldVoiceState.channelId){
			if (channels[oldVoiceState.channelId]){
				scanOne(oldVoiceState.channel);
			}
		}
		if (newVoiceState.channelId){
			if (channels[newVoiceState.channelId]){
				scanOne(newVoiceState.channel);
			}
		}
	}
});

client.on('presenceUpdate', (oldPresence, newPresence) => {
	if(newPresence.member && newPresence.member.voice.channelId){
		// if their voice channel is managed by the bot
		if(channels[newPresence.member.voice.channelId]){
			scanOne(newPresence.member.voice.channel);
		}
	}
});

client.on('messageCreate', message =>{
	if(message.guild){
		if(message.content[0]==="!"){
			var messageL=message.content.toLowerCase()
			if (messageL === "!invite") {
				message.reply("https://discordapp.com/oauth2/authorize?client_id=" + client.user.id + "&scope=bot&permissions=16");
			} else if (messageL==="!addvc") {
				var checks = commandChecks(message);
				if (!checks.pass) return;
				if (!channels[checks.vc.id]) {
					channels[checks.vc.id] = [checks.vc.name, 0.5, "X - Y"];
					autosave()
					message.reply("Successfully added `"+checks.vc.name+"` to my list")
					scanOne(checks.vc)
				} else {
					message.reply("`"+channels[checks.vc.id][0]+"` is already on my list.")
				}
			} else if(messageL==="!removevc") {
				var checks = commandChecks(message);
				if (!checks.pass) return;
				if (channels[checks.vc.id]){
					if (checks.vc.manageable){
						checks.vc.setName(channels[checks.vc.id][0])
					}
					delete channels[checks.vc.id];
					autosave();
					message.reply("Successfully removed `"+checks.vc.name+"` from my list.");
				}else{
					message.reply("`"+checks.vc.name+"` was not on my list.");
				}

			} else if(messageL==="!template"){
				if (message.member.voice.channel) {
					var vcid = message.member.voice.channelId;
					if (channels[vcid]) {
						message.reply("Template for `"+channels[vcid][0]+"` is `"+channels[vcid][2]+"`");
					}
				}
			} else if(messageL.indexOf("!template ")===0) {
				var checks = commandChecks(message);
				if (!checks.pass) return;
				if (channels[checks.vc.id]) {
					var newTemplate=message.content.substr(10).trim();
					if (newTemplate.length < 100) {
						if(newTemplate.includes("Y")) {
							channels[checks.vc.id][2] = newTemplate;
							message.reply("The template for `" + channels[checks.vc.id][0] + "` is now "+newTemplate);
							scanOne(checks.vc.id);
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
			}else if(messageL==="!majority") {
				if(message.member.voice.channel) {
					var vcid = message.member.voice.channelId;
					if(channels[vcid]) {
						message.reply("Majority for `"+channels[vcid][0]+"`: "+channels[vcid][1]*100+"%");
					}
				}
			}else if (messageL.indexOf("!majority ")===0) {
				var checks = commandChecks(message);
				if (!checks.pass) return;
				if (channels[checks.vc.id]) {
					var majority = parseInt(messageL.substr(10));
					if (majority > 0 && majority < 100) {
						channels[checks.vc.id][1] = majority / 100;
						message.reply("Set majority for channel `"+channels[checks.vc.id][0]+"` to "+majority+"%");
						scanOne(checks.vc);
						autosave();
					} else {
						message.reply("Invalid input. Number must be between 1 and 99.");
					}
				} else {
					message.reply("Please run `!addvc` first.");
				}
			}else if (messageL==="!help"){
				message.channel.send("__Channel Changer Help__\n*The purpose of Channel Changer is to add what game you're playing to your connected voice channel's name.*\n**!addvc**: Adds your voice channel to be renamed.\n**!removevc**: Removes your voice channel from the list.\n**!majority**: Sets what percentage of people have to be playing the same game for it to change the name. From 1-100.\n**!template**: Sets the template. Default: `!template X - Y`. 'X' represents the original channel name, and 'Y' represents the majority game. If no new template is provided it will reply with the currently set template.\n**!invite**: Get the link to invite the bot.");
			}
		}
	}
})

client.on("guildCreate", guild=>{
	console.log("Joined "+guild.name);
})

client.on("guildDelete", guild => {
	console.log("Left "+guild.name);
	prune();
})

// I am a nihilist
process.on('unhandledRejection', function (err) {

});

