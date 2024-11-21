const {TennisSet} = require("./TennisSet");

class Match {
  __result;

  player1;
  player2;
  winner;
  looser;

  constructor(obj = {}) {
    this.player1 = obj.player1;
    this.player2 = obj.player2;
  }

  determineWinner() {
    if (this.result.p1 > this.result.p2) {
      this.winner = this.player1;
      this.looser = this.player2;
    } else {
      this.winner = this.player2;
      this.looser = this.player1;
    }
  }

  updateMetadataAfterMatch = () => {
    console.log("abstract");
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
