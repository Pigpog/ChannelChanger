module.exports = {
	"whitelist": {
		"channels": false,
		"admin": false
	},
	// This will ignore seperate Guild preferences if provided true. Instead of using preferences it will use the Default Config or Defualt Abbreviations
	"centralize": {
		"configs": true,
		"abbreviations": true
	},

	// If true it will log everything that is happening.
	// otherwise only Errors will appear
	"debug": true
}