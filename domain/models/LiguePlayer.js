class LiguePlayer {
  player;
  points;
  champs;
  constructor(player) {
    this.player = player;
    this.points = 0;
    this.champs = [];
  }
}

module.exports = {
  LiguePlayer,
};
