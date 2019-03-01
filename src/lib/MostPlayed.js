module.exports =
    class MostPlayed {
        constructor(channel) {
            this.mostPlayed = undefined
            this.sum = 0
            this.games = {}
            if (channel.members.size != 0) {
                // Count all the games being played
                channel.members.forEach(member => {
                    if (member.presence.game) {
                        let game = member.presence.game
                        if (this.games[game.name]) {
                            this.sum += 1
                            this.games[game.name].count += 1
                        } else {
                            this.sum += 1
                            this.games[game.name] = {
                                "count": 1,
                                "percent": 0,
                                "name": game.name,
                                "decimal": 0
                            }
                        }
                    }
                })

                // Sort it
                let sort = []
                Object.keys(this.games).forEach(game => {
                    this.games[game].decimal = (this.games[game].count / this.sum)
                    this.games[game].percent = (this.games[game].decimal * 100)
                    sort.push([this.games[game].count, game])
                })
                sort.sort();
                if (sort.length != 0) {
                    if (sort.length > 2) {
                        if (sort[sort.length - 1][0] != sort[sort.length - 2][0]) {
                            this.mostPlayed = this.games[sort[sort.length - 1][1]]
                        }
                    } else this.mostPlayed = this.games[sort[sort.length - 1][1]]
                }
            }
        }
    }