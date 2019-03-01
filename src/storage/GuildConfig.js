const Config = require(__dirname + "/../lib/Config.js")
module.exports =
    class GuildConfig extends Config {
        constructor(id, obj) {
            super(obj);
            this.id = id
            this.admin = new Set();
            this.channels = new Set();
            if (obj) {
                Object.keys(obj).forEach(key => {
                    if (Object.keys(this).includes(key)) {
                        if (typeof obj[key][Symbol.iterator] === 'function') {
                            if (obj[key] instanceof Array) {
                                this[key] = new Set(obj[key]);
                            }
                            if (obj[key] instanceof Set) {
                                this[key] = obj[key];
                            }
                        } else {
                            this[key] = obj[key]

                        }
                    }
                })
            }
        }
        JSONify() {
            let jsonified = this
            jsonified.admin = Array.from(this.admin);
            jsonified.channels = Array.from(this.channels);
            return jsonified
        }
    }