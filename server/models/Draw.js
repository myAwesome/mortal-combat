const { points, fakeResults, DRAW_MAP } = require("./mocks");
const { PlayOffMatch } = require("./Match");

/**
 * Play-off
 **/
class Draw {
  capacity;
  qualifiers;
  placesPriority;
  emptySlots;
  matchesLength;
  matches;
  constructor() {
    this.matches = [];
  }

  // 7. fill play-off champ.draw.matches
  fillMatches = (drawPlayersWithLocation) => {
    let j = 0;
    for (let i = 0; i < drawPlayersWithLocation.length - 1; i = i + 2) {
      j++;
      const playersInRound = drawPlayersWithLocation.length;
      this.matches.push(
        new PlayOffMatch({
          playersInRound,
          stage: DRAW_MAP[playersInRound],
          matchNumberInRound: j,
          player1: {
            player: drawPlayersWithLocation[i],
            points: points["16"],
            groupMetadata: {
              points: 0,
              win: 0,
              loose: 0,
            },
          },
          player2: {
            player: drawPlayersWithLocation[i + 1],
            points: points["16"],
            groupMetadata: {
              points: 0,
              win: 0,
              loose: 0,
            },
          },
          // todo: remove fakeResults
          result:
            drawPlayersWithLocation[i].player.name === "bye" ||
            drawPlayersWithLocation[i + 1].player.name === "bye"
              ? "-"
              : fakeResults[Math.floor(Math.random() * fakeResults.length)],
        })
      );
    }
  };

  handleRounds = () => {
    const nextRound = [];
    let playersInRound = this.handleRound(this.matches, nextRound);
    this.matches.push(...nextRound[playersInRound]);
    while (playersInRound !== 1) {
      playersInRound = this.handleRound(nextRound[playersInRound], nextRound);
      this.matches.push(...nextRound[playersInRound]);
    }
  };

  handleRound = (matchesInRound, nextRound) => {
    let j = 0;
    const playersInRound = matchesInRound[0].playersInRound / 2;
    console.log(playersInRound);
    if (playersInRound === 1) {
      console.log(matchesInRound);
    }
    nextRound[playersInRound] = [];
    matchesInRound.reduce((prev, curr) => {
      const currWinner = curr.determineWinner();
      if (!prev) {
        j++;
        return {
          playersInRound,
          stage: DRAW_MAP[playersInRound],
          matchNumberInRound: j,
          player1: currWinner,
        };
      } else {
        nextRound[playersInRound].push(
          new PlayOffMatch({
            ...prev,
            player2: currWinner,
            result: fakeResults[Math.floor(Math.random() * fakeResults.length)],
          })
        );
        return null;
      }
    }, null);
    return playersInRound;
  };
}
module.exports = { Draw };
