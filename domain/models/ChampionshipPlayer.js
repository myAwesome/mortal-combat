class ChampionshipPlayer {
  player;
  points = 0;
  constructor(player) {
    this.player = player;
  }
}

const groupNames = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "V",
  "X",
  "Y",
  "Z",
];

module.exports = {
  ChampionshipPlayer,
  groupNames,
};
