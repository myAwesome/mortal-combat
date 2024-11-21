const {PlayOffPlayer} = require("./PlayOffPlayer");
const {Match} = require("./Match");

class PlayOffMatch extends Match {
    id;
    prize;
    stage;
    matchNumberInRound;
    playersInRound;
    nextMatchForWinner;
    nextMatchForLooser;
    draw;
    constructor(obj = {}) {
        super(obj);
        this.prize = obj.prize;
        this.stage = obj.stage;
        this.matchNumberInRound = obj.matchNumberInRound;
        this.playersInRound = obj.playersInRound;
        this.nextMatchForWinner = obj.nextMatchForWinner;
        this.nextMatchForLooser = obj.nextMatchForLooser;
        this.draw = obj.draw;

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
        this.draw.addCompletedMatch();
    };

    hasPlayer = (player) => {
        return (
            (this.player1 && this.player1.player === player) ||
            (this.player2 && this.player2.player === player)
        );
    };
}
module.exports = { PlayOffMatch };