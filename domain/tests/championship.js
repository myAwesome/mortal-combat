const { strictEqual, stats, offTests } = require("../models/util");
const { Championship } = require("../models/Championship");
const { players, randResult, points, groupPoints } = require("../models/mocks");
// const util = require("util");

// offTests();

const shufflePlayers = (players, capacity) => {
  return [...players].sort(() => 0.5 - Math.random()).slice(0, capacity);
};

const smash750 = new Championship("Smash 750", 9);
strictEqual(smash750.name, "Smash 750");
strictEqual(smash750.capacity, 9);
smash750.points = points;
smash750.groupPoints = groupPoints;

const shuffledPlayers = shufflePlayers(players, smash750.capacity);
smash750.entryList = shuffledPlayers;
strictEqual(smash750.players.length, shuffledPlayers.length);

smash750.createGroups();
strictEqual(smash750.groups.length, 3);
strictEqual(smash750.groups[0].name, "A");

smash750.createDraw();

// fill group results
smash750.groups.forEach((g) => {
  g.matches.forEach((m) => {
    m.result = randResult();
  });
});

// tested in group test
smash750.groups.forEach((g) => g.players.sort(g.orderPlaces));
smash750.groups.forEach((g) => {
  g.orderPlayersByPlace();
});

smash750.addPointsAccordingToPlace();

smash750.joinedGroupsResult = smash750.createJoinedGroupsResult(
  smash750.groups
);

strictEqual(smash750.joinedGroupsResult[0].groupMetadata.place, 1);
smash750.joinedGroupsResult.forEach((p, i, arr) => {
  if (arr[i + 1]) {
    strictEqual(p.groupMetadata.place <= arr[i + 1].groupMetadata.place, true);
  }
});
smash750.prepareQualifiersForDraw();

strictEqual(
  smash750.qualifiersAndBye[smash750.qualifiersAndBye.length - 1].player.name,
  "bye"
);
strictEqual(
  smash750.qualifiersAndBye[smash750.qualifiersAndBye.length - 2].player.name,
  "bye"
);

smash750.seedDrawPlayers();
// todo: test for seedDrawPlayers

smash750.startDraw();
// todo: test for startDraw

smash750.draw.matches.forEach((m, i, arr) => {
  if (m.playersInRound === 8) {
    m.result = randResult();
  }
});

smash750.draw.matches.forEach((m, i, arr) => {
  if (m.playersInRound === 4) {
    m.result = randResult();
  }
});

smash750.draw.matches.forEach((m, i, arr) => {
  if (m.playersInRound === 2) {
    m.result = randResult();
  }
});

smash750.createTournamentResult();
// console.log(smash750.players);
stats();
