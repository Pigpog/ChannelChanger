const fs = require('fs');
/**
 * Deployable Promise-oriented data handling
 * @param {String} path [full directory]
 * @param {Boolean} json [Will parse and stringify if it is]
 * @returns {Object<Methods>}
 */
module.exports = (path, json) => {
  let dir = path.endsWith("/") ? path : path += "/"
  let isJSON = json
  return {
    /**
     * @method get
     * @param {String} name
     * @returns {Promise<data>}
     */
    get: (name) => {
      return new Promise((res, rej) => {
        fs.readFile(dir + name, (err, data) => {
          if (err) rej (err)
            else res(isJSON ? JSON.parse(data) : data)
        })
      })
    },

    /**
     * @method set
     * @param {String} name
     * @param {a} data
     * @returns {Promise<String, Err>}
     */
    set: (name, data) => {
      return new Promise((res, rej) => {
        fs.writeFile(dir + name, isJSON ? JSON.stringify(data) : data, err => {
          if (err) rej(err)
          else res("File saved")
        })
      })
    },

    /**
     * @method ls
     * @returns {Array<Filenames>}
     */
    ls: () => {
      return fs.readdirSync(dir)
    },

    delete: name => {
      return new Promise((res, rej) => {
        if (fs.existsSync(dir + name)) {
          fs.unlinkSync(dir + name)
          res("File deleted")
        } else rej(new Error("File does not exist."))
      })
    },
  }
}
