const { strictEqual, throws, stats } = require("../models/util");
const { Group } = require("../models/Group");
const { Player, GroupPlayer } = require("../models/Player");
const { players } = require("../models/mocks");

const groupA = new Group("A");
groupA.capacity = 3;
const kei = new GroupPlayer(new Player("Kei"));
const jo = new GroupPlayer(new Player("Jo"));
const ivo = new GroupPlayer(new Player("Ivo"));
groupA.addPlayer(kei);
strictEqual(groupA.players.includes(kei), true);
strictEqual(kei.groupMetadata.group, "A");
groupA.addPlayer(jo);
groupA.addPlayer(ivo);

// test out of capacity
throws(() => {
  const kutuzov = new GroupPlayer(new Player("kutuzov"));
  groupA.addPlayer(kutuzov);
});

groupA.createMatches();
strictEqual(groupA.matches.length, 3);

groupA.matches.forEach((m, i) => {
  if (
    (m.player1 === kei && m.player2 === jo) ||
    (m.player2 === kei && m.player1 === jo)
  ) {
    m.result = "6-4";
  }
  if (
    (m.player1 === kei && m.player2 === ivo) ||
    (m.player2 === kei && m.player1 === ivo)
  ) {
    m.result = "6-4";
  }
  if (
    (m.player1 === jo && m.player2 === ivo) ||
    (m.player2 === jo && m.player1 === ivo)
  ) {
    m.result = "6-4";
  }
});

groupA.players.sort(Group.orderPlaces);
groupA.orderPlayersByPlace();
strictEqual(kei.groupMetadata.place, 1);
strictEqual(jo.groupMetadata.place, 2);
strictEqual(ivo.groupMetadata.place, 3);

stats();
