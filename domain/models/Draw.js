const { DRAW_MAP } = require("./mocks");
const { isOdd } = require("../../utils/util");
const { PlayOffMatch } = require("./PlayOffMatch");

class Draw {
  capacity;
  qualifiers;
  placesPriority;
  emptySlots;
  matches;
  completedMatches;
  champ;

  constructor(capacity, champ = null) {
    this.capacity = capacity;
    this.qualifiers = null;
    this.placesPriority = null;
    this.emptySlots = 0;
    this.matches = new Map();
    this.completedMatches = 0;
    this.champ = champ;
  }

  // Match ID utilities
  getMatchId = (m) =>
      `p${m.prize}-s${DRAW_MAP[m.playersInRound]}-n${m.matchNumberInRound}`;

  getNextMatchId = (m, isWinner) => {
    const prize = isWinner ? m.prize : this.getPrizeForLoser(m);
    return this.getMatchId({
      prize,
      playersInRound: m.playersInRound / 2,
      matchNumberInRound: Math.ceil(m.matchNumberInRound / 2),
    });
  };

  getPrizeForLoser = (m) => m.prize + m.playersInRound / 2;

  createMatches = (capacity) => {
    // Creates and assigns matches for the first round
    for (let i = 1; i <= capacity / 2; i++) {
      const initialMatch = this.createMockedMatch(capacity, i);
      const nextMatch = this.createNextMatch(initialMatch, true);
      nextMatch.id = this.getMatchId(nextMatch);
      this.matches.set(nextMatch.id, nextMatch);
    }
  };

  createMockedMatch = (capacity, matchNum) => {
    return new PlayOffMatch({
      prize: 1,
      stage: DRAW_MAP[capacity * 2],
      matchNumberInRound: matchNum * 2,
      playersInRound: capacity * 2,
      setsToWin: this.champ?.setsToWin ?? 1,
    });
  };

  // Recursively creates and links matches for winners and losers
  createNextMatch = (m, isWinner) => {
    const prize = isWinner ? m.prize : this.getPrizeForLoser(m);
    const currentMatch = new PlayOffMatch({
      prize,
      stage: DRAW_MAP[m.playersInRound / 2],
      matchNumberInRound: Math.ceil(m.matchNumberInRound / 2),
      playersInRound: m.playersInRound / 2,
      draw: this,
      setsToWin: this.champ?.setsToWin ?? 1,
    });

    currentMatch.id = this.getMatchId(currentMatch);

    if (currentMatch.playersInRound > 2) {
      this.assignNextMatches(currentMatch);
    }
    return currentMatch;
  };

  assignNextMatches = (match) => {
    // Creates the next match for the winner
    const nextWinnerId = this.getNextMatchId(match, true);
    if (!this.matches.has(nextWinnerId)) {
      this.matches.set(nextWinnerId, this.createNextMatch(match, true));
    }
    match.nextMatchForWinner = this.matches.get(nextWinnerId);

    // Creates the next match for the loser
    const nextLoserId = this.getNextMatchId(match, false);
    if (!this.matches.has(nextLoserId)) {
      this.matches.set(nextLoserId, this.createNextMatch(match, false));
    }
    match.nextMatchForLoser = this.matches.get(nextLoserId);
  };

  static calcPlacesPriority = (capacity) => {
    const places = Array.from({ length: capacity }, (_, i) => i + 1);
    const splitGroups = [];
    const seedPlaces = [];

    const splitAndCollect = (list) => {
      if (list.length <= 2) return;
      splitGroups.push([...list]);
      const mid = Math.ceil(list.length / 2);
      const firstHalf = list.splice(0, mid);
      const secondHalf = list.splice(-mid);
      splitAndCollect(firstHalf);
      splitAndCollect(secondHalf);
    };

    splitAndCollect(places);
    splitGroups.sort((a, b) => b.length - a.length);

    splitGroups.forEach((group) => {
      seedPlaces.push(group[0]);
      seedPlaces.push(group[group.length - 1]);
    });

    const placesPriority = [...new Set(seedPlaces)];
    placesPriority.push(
        ...placesPriority.map((place) =>
            isOdd(place) ? place + 1 : place - 1
        ).reverse()
    );

    return placesPriority;
  };

  addCompletedMatch = () => {
    this.completedMatches++;
    if (this.completedMatches === this.matches.size && this.champ) {
      this.champ.onCompletedDraw();
    }
  };
}

module.exports = { Draw };
