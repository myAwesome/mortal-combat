const { GroupMatch } = require("./Match");
const { fakeResults } = require("./mocks");

class Group {
  name;
  players;
  matches;
  constructor(name) {
    this.name = name;
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
          // todo: remove fakeResults
        });
        match.result =
          fakeResults[Math.floor(Math.random() * fakeResults.length)];
        match.determineWinner();
        this.matches.push(match);
      }
    });
  };
}

module.exports = { Group };
