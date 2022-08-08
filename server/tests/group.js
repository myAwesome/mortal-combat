const { strictEqual, throws, stats } = require("../models/util");
const { Group } = require("../models/Group");
const { Player, GroupPlayer } = require("../models/Player");

const groupA = new Group("A");
groupA.capacity = 3;
const kei = new GroupPlayer(new Player("Kei"));
const jo = new GroupPlayer(new Player("Jo"));
const ivo = new GroupPlayer(new Player("Ivo"));
groupA.addPlayer(kei);
strictEqual(groupA.players.includes(kei), true);
groupA.addPlayer(jo);
groupA.addPlayer(ivo);

// test out of capacity
throws(() => {
  const kutuzov = new GroupPlayer(new Player("kutuzov"));
  groupA.addPlayer(kutuzov);
});

groupA.createMatches();
strictEqual(groupA.matches.length, 3);

stats();
