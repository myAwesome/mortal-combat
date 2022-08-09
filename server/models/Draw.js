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
  matches;
  constructor(capacity) {
    this.capacity = capacity;
    this.matches = new Map();
  }

  createMatches = (capacity) => {
    const findMatch = (id) => this.matches.get(id);
    const getMatchId = (m) =>
      `p${m.prize}-s${DRAW_MAP[m.playersInRound]}-n${m.matchNumberInRound}`;
    const getNextMatchIdForWinner = (m) =>
      getMatchId({
        prize: m.prize,
        playersInRound: m.playersInRound / 2,
        matchNumberInRound: Math.ceil(m.matchNumberInRound / 2),
      });

    const getPrizeForLooser = (m) => m.prize + m.playersInRound / 2;
    const getNextMatchIdForLooser = (m) =>
      getMatchId({
        prize: getPrizeForLooser(m),
        playersInRound: m.playersInRound / 2,
        matchNumberInRound: Math.ceil(m.matchNumberInRound / 2),
      });

    const createNextMatch = (m, isWinner) => {
      const prize = isWinner ? m.prize : getPrizeForLooser(m);
      const currentMatch = {
        prize,
        stage: DRAW_MAP[m.playersInRound / 2],
        matchNumberInRound: Math.ceil(m.matchNumberInRound / 2),
        playersInRound: m.playersInRound / 2,
      };
      currentMatch.id = getMatchId(currentMatch);

      if (currentMatch.playersInRound > 2) {
        const nextMatchWinnerId = getNextMatchIdForWinner(currentMatch);
        if (!findMatch(nextMatchWinnerId)) {
          this.matches.set(
            nextMatchWinnerId,
            createNextMatchForWinner(currentMatch)
          );
        }
        currentMatch.nextMatchForWinner = this.matches.get(nextMatchWinnerId);

        const nextMatchLooserId = getNextMatchIdForLooser(currentMatch);
        if (!findMatch(nextMatchLooserId)) {
          this.matches.set(
            nextMatchLooserId,
            createNextMatchForLooser(currentMatch)
          );
        }
        currentMatch.nextMatchForLooser = this.matches.get(nextMatchLooserId);
      }
      return currentMatch;
    };

    const createNextMatchForWinner = (m) => {
      return createNextMatch(m, true);
    };

    const createNextMatchForLooser = (m) => {
      return createNextMatch(m, false);
    };

    // creating FIRST round matches
    for (let i = 1; i < capacity / 2 + 1; i++) {
      const mockedPrevMatch = {
        prize: 1,
        stage: DRAW_MAP[capacity * 2],
        matchNumberInRound: i * 2,
        playersInRound: capacity * 2,
      };
      const currentMatch = createNextMatch(mockedPrevMatch, true);
      currentMatch.id = getMatchId(currentMatch);
      this.matches.set(currentMatch.id, currentMatch);
    }
  };

  /**
   * todo: tests
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
   **/
}
module.exports = { Draw };
