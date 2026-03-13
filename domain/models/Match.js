const {TennisSet} = require("./TennisSet");

class Match {
  __result;

  player1;
  player2;
  winner;
  loser;

  constructor(obj = {}) {
    this.__result = null;
    this.player1 = obj.player1 ?? null;
    this.player2 = obj.player2 ?? null;
    this.winner = null;
    this.loser = null;
  }

  determineWinner() {
    if (this.result.p1Wins()) {
      this.winner = this.player1;
      this.loser = this.player2;
    } else {
      this.winner = this.player2;
      this.loser = this.player1;
    }
  }

  updateMetadataAfterMatch = () => {
    // console.log("abstract");
  };

  set result(result) {
    this.__result = new TennisSet(result);
    this.determineWinner();
    this.updateMetadataAfterMatch();
  }

  get result() {
    return this.__result;
  }
}

module.exports = { Match };
