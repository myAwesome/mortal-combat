const { DRAW_MAP } = require("./mocks");
const { isOdd } = require("./util");
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
      // todo: PlayOffMatch
      const currentMatch = new PlayOffMatch({
        prize,
        stage: DRAW_MAP[m.playersInRound / 2],
        matchNumberInRound: Math.ceil(m.matchNumberInRound / 2),
        playersInRound: m.playersInRound / 2,
      });

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
      const mockedPrevMatch = new PlayOffMatch({
        prize: 1,
        stage: DRAW_MAP[capacity * 2],
        matchNumberInRound: i * 2,
        playersInRound: capacity * 2,
      });

      const currentMatch = createNextMatch(mockedPrevMatch, true);
      currentMatch.id = getMatchId(currentMatch);
      this.matches.set(currentMatch.id, currentMatch);
    }
  };

  static calcPlacesPriority = (capacity) => {
    const places = [...Array(capacity).keys()].map((i) => i + 1);
    const splitedPlaces = [];
    const seedPlaces = [];

    // todo: оптимізувати/ зробити хоч якось читаємим
    const rf = (list) => {
      if (list.length <= 2) return;
      splitedPlaces.push([...list]);
      const middleIndex = Math.ceil(list.length / 2);
      const firstHalf = list.splice(0, middleIndex);
      const secondHalf = list.splice(-middleIndex);
      rf(firstHalf);
      rf(secondHalf);
    };

    rf(places);
    splitedPlaces.sort((b, a) => {
      if (a.length > b.length) {
        return 1;
      }
      if (a.length < b.length) {
        return -1;
      }
      return 0;
    });

    splitedPlaces.forEach((el) => {
      if (!seedPlaces.includes(el[0])) {
        seedPlaces.push(el[0]);
      }
      if (!seedPlaces.includes(el[el.length - 1])) {
        seedPlaces.push(el[el.length - 1]);
      }
    });

    const placesPriority = [...seedPlaces];
    for (let i = seedPlaces.length - 1; i >= 0; i--) {
      placesPriority.push(
        isOdd(seedPlaces[i]) ? seedPlaces[i] + 1 : seedPlaces[i] - 1
      );
    }

    return placesPriority;
  };
}
module.exports = { Draw };
