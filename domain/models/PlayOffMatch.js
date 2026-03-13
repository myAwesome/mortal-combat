const {PlayOffPlayer} = require("./PlayOffPlayer");
const {Match} = require("./Match");

class PlayOffMatch extends Match {
    id;
    prize;
    stage;
    matchNumberInRound;
    playersInRound;
    nextMatchForWinner;
    nextMatchForLoser;
    draw;
    constructor(obj = {}) {
        super(obj);
        this.id = obj.id ?? null;
        this.prize = obj.prize ?? null;
        this.stage = obj.stage ?? null;
        this.matchNumberInRound = obj.matchNumberInRound ?? null;
        this.playersInRound = obj.playersInRound ?? null;
        this.nextMatchForWinner = obj.nextMatchForWinner ?? null;
        this.nextMatchForLoser = obj.nextMatchForLoser ?? null;
        this.draw = obj.draw ?? null;

        if (
            (this.player1 && this.player1.isBye) ||
            (this.player2 && this.player2.isBye)
        ) {
            this.determineWinner();
            this.updateMetadataAfterMatch();
        }
    }

    determineWinner() {
        if (this.player1.isBye || this.player2.isBye) {
            if (this.player1.isBye) {
                this.winner = this.player2;
                this.loser = this.player1;
            } else {
                this.winner = this.player1;
                this.loser = this.player2;
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

        if (this.nextMatchForLoser) {
            if (!this.nextMatchForLoser.player1) {
                this.nextMatchForLoser.player1 = new PlayOffPlayer(
                    this.loser.player,
                    this.loser.isBye
                );
            } else {
                this.nextMatchForLoser.player2 = new PlayOffPlayer(
                    this.loser.player,
                    this.loser.isBye
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