module.exports = {
	"config": {
		'main': require('../config/main.js')
	},
	"lib": {
		'changer': require('./lib/changer.js'),
		'Config': require('./lib/Config.js'),
		'MostPlayed': require('./lib/MostPlayed.js')
	},
	"storage": {
		'abbreviations': require('./storage/guilds/0.json'),
		'bot': require('./storage/bot.json'),
		'config': require('./storage/guilds/0.json'), // Default Config
		'dir': __dirname + '/storage/',
		'guilds': __dirname + '/storage/guilds/',
		'help': require('./storage/help.js')
	}
}

