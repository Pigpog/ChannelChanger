module.exports = {
	"config": {
		'main': require('../config/main.js')
	},
	"lib": {
		'changer': require('./lib/changer.js'),
		'Config': require('./lib/Config.js'),
		'MostPlayed': require('./lib/MostPlayed.js'),
		'names': require('./lib/names.json')
	},
	"storage": {
		'dir': __dirname + '/storage/',
		'bot': require('./storage/bot.json'),
		'guilds': __dirname + '/storage/guilds/',
		// Default Config
		'config': require('./storage/guilds/0.json'),
		// Defaut Abbreviations
		'abbreviations': require('./storage/guilds/0.json')
	}
}

