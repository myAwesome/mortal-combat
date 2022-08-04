const { PlayOffPlayer } = require("./Player");

class TennisSet {
  p1;
  p2;
  constructor(setString) {
    const [p1, p2] = setString.split("-").map((s) => s * 1);
    this.p1 = p1;
    this.p2 = p2;
  }
}

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

class GroupMatch extends Match {
  constructor(obj) {
    super(obj);
  }

  updateMetadataAfterMatch = () => {
    const p1 = this.result.p1,
      p2 = this.result.p2;
    this.player1.groupMetadata.win += p1;
    this.player1.groupMetadata.loose += p2;
    this.player2.groupMetadata.win += p2;
    this.player2.groupMetadata.loose += p1;
    p1 > p2
      ? ++this.player1.groupMetadata.points
      : ++this.player2.groupMetadata.points;
  };
}

class PlayOffMatch extends Match {
  stage;
  matchNumberInRound;
  playersInRound;
  nextMatchForWinner;
  nextMatchForLooser;

  constructor(obj = {}) {
    super(obj);
    this.stage = obj.stage;
    this.matchNumberInRound = obj.matchNumberInRound;
    this.playersInRound = obj.playersInRound;
    this.nextMatchForWinner = obj.nextMatchForWinner;
    this.nextMatchForLooser = obj.nextMatchForLooser;

    if (
      (this.player1 && this.player1.isBye) ||
      (this.player2 && this.player2.isBye)
    ) {
      this.result = "bye";
    }
  }

  determineWinner() {
    if (this.player1.isBye || this.player2.isBye) {
      if (this.player1.isBye) {
        this.winner = this.player2;
        this.looser = this.player1;
      } else {
        this.winner = this.player1;
        this.looser = this.player2;
      }
    } else {
      super.determineWinner();
    }
  }

  updateMetadataAfterMatch = () => {
    if (this.nextMatchForWinner) {
      if (!this.nextMatchForWinner.player1) {
        this.nextMatchForWinner.player1 = new PlayOffPlayer(
          this.winner.player,
          this.winner.isBye
        );
      } else {
        this.nextMatchForWinner.player2 = new PlayOffPlayer(
          this.winner.player,
          this.winner.isBye
        );
      }
    }

    if (this.nextMatchForLooser) {
      if (!this.nextMatchForLooser.player1) {
        this.nextMatchForLooser.player1 = new PlayOffPlayer(
          this.looser.player,
          this.looser.isBye
        );
      } else {
        this.nextMatchForLooser.player2 = new PlayOffPlayer(
          this.looser.player,
          this.looser.isBye
        );
      }
    }
  };

  hasPlayer = (player) => {
    return (
      (this.player1 && this.player1.player === player) ||
      (this.player2 && this.player2.player === player)
    );
  };
}
module.exports = { Match, PlayOffMatch, GroupMatch };
