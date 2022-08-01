class Player {
  id;
  name;
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}

class GroupMetadata {
  points;
  win;
  loose;
  place;
  group;

  constructor() {
    this.points = 0;
    this.win = 0;
    this.loose = 0;
  }
}

class GroupPlayer {
  player;
  groupMetadata;
  constructor(player) {
    this.player = player;
    this.groupMetadata = new GroupMetadata();
  }
}

class PlayOffPlayer {
  player;
  isBye;
  draw;
  location;
  constructor(player, isBye = false, draw, location) {
    this.player = player;
    this.isBye = isBye;
    this.draw = draw;
    this.location = location;
  }
}

module.exports = { Player, GroupPlayer, PlayOffPlayer };
