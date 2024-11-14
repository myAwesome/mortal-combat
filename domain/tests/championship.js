const { strictEqual, stats, offTests } = require("../../utils/util");
const { Championship } = require("../models/Championship");
const { randResult, points, groupPoints } = require("../models/mocks");
const { Player } = require("../models/Player");

const players = [
  new Player("Roger Federer"),
  new Player("Rafael Nadal"),
  new Player("Novak Djokovic"),
  new Player("Andy Murray"),
  new Player("Juan Martin del Potro"),
  new Player("Andy Roddick"),
  new Player("Robin Soderling"),
  new Player("Jo-Wilfried Tsonga"),
  new Player("Marin Cilic"),
  new Player("Fernando Verdasco"),
  new Player("Fernando Gonzalez"),
  new Player("Gael Monfils"),
  new Player("Gilles Simon"),
  new Player("David Ferrer"),
  new Player("Lleyton Hewitt"),
  new Player("Stan Wawrinka"),
  new Player("Tommy Robredo"),
  new Player("Juan Carlos Ferrero"),
  new Player("Tomas Berdych"),
  new Player("David Nalbandian"),
];

// offTests();

const shufflePlayers = (players, capacity) => {
  return [...players].sort(() => 0.5 - Math.random()).slice(0, capacity);
};

const usOpen = new Championship("Us Open 2008", 9);
strictEqual(usOpen.name, "Us Open 2008");
strictEqual(usOpen.capacity, 9);
usOpen.points = points;
usOpen.groupPoints = groupPoints;

const shuffledPlayers = shufflePlayers(players, usOpen.capacity);
usOpen.entryList = shuffledPlayers;
strictEqual(usOpen.players.length, shuffledPlayers.length);

usOpen.createGroups();
strictEqual(usOpen.groups.length, 3);
strictEqual(usOpen.groups[0].name, "A");

usOpen.createDraw();

// fill group results
usOpen.groups.forEach((g) => {
  g.matches.forEach((m) => {
    m.result = randResult();
  });
});

// tested in group test
usOpen.groups.forEach((g) => g.players.sort(g.orderPlaces));
usOpen.groups.forEach((g) => {
  g.orderPlayersByPlace();
});

usOpen.addPointsAccordingToPlace();

usOpen.joinedGroupsResult = usOpen.createJoinedGroupsResult(usOpen.groups);

strictEqual(usOpen.joinedGroupsResult[0].groupMetadata.place, 1);
usOpen.joinedGroupsResult.forEach((p, i, arr) => {
  if (arr[i + 1]) {
    strictEqual(p.groupMetadata.place <= arr[i + 1].groupMetadata.place, true);
  }
});
usOpen.prepareQualifiersForDraw();

strictEqual(
  usOpen.qualifiersAndBye[usOpen.qualifiersAndBye.length - 1].player.name,
  "bye"
);
strictEqual(
  usOpen.qualifiersAndBye[usOpen.qualifiersAndBye.length - 2].player.name,
  "bye"
);

usOpen.seedDrawPlayers();
// todo: test for seedDrawPlayers

usOpen.startDraw();
// todo: test for startDraw

//todo: weak approach
usOpen.draw.matches.forEach((m) => {
  if (m.playersInRound === 8) {
    m.result = randResult();
  }
});

usOpen.draw.matches.forEach((m) => {
  if (m.playersInRound === 4) {
    m.result = randResult();
  }
});

usOpen.draw.matches.forEach((m) => {
  if (m.playersInRound === 2) {
    m.result = randResult();
  }
});

usOpen.createTournamentResult();
stats();
