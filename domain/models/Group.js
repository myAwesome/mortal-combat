const { GroupMatch } = require("./GroupMatch");

class Group {
  name;
  players;
  matches;
  capacity;
  constructor(name) {
    this.name = name;
    this.capacity = 0;
    this.players = [];
    this.matches = [];
  }

  static orderPlaces = (a, b) => {
    const { groupMetadata: agm } = a;
    const { groupMetadata: bgm } = b;
    if (agm.points > bgm.points) {
      return -1;
    }
    if (agm.points < bgm.points) {
      return 1;
    }

    // compare diffs
    if (agm.win - agm.loose > bgm.win - bgm.loose) {
      return -1;
    }

    if (agm.win - agm.loose < bgm.win - bgm.loose) {
      return 1;
    }
    return 0;
  };

  createMatches = () => {
    const capacity = this.players.length;
    this.players.forEach((player, key) => {
      for (let opponent_id = key + 1; opponent_id < capacity; opponent_id++) {
        const match = new GroupMatch({
          player1: player,
          player2: this.players[opponent_id],
        });
        this.matches.push(match);
      }
    });
  };

  addPlayer = (player) => {
    if (this.players.length < this.capacity) {
      player.groupMetadata.group = this.name;
      this.players.push(player);
    } else {
      throw new Error("group is full");
    }
  };

  orderPlayersByPlace = () => {
    this.players.forEach((p, i) => {
      p.groupMetadata.place = i + 1;
    });
  };
}

module.exports = { Group };
