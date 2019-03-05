module.exports =
    class Config {
        constructor(obj) {
            this.abbreviations = [];
            this.majority = 100;
            this.template = "X - Y";
            if (obj) {
                Object.keys(obj).forEach(key => {
                    if (Object.keys(this).includes(key)) {
                        this[key] = obj[key]
                    }
                })
            }
        }
    }