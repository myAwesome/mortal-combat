const { stats } = require("../../utils/util");
const { Player } = require("../models/Player");
const { LiguePlayer } = require("../models/LiguePlayer");
const { Championship } = require("../models/Championship");
const { points, groupPoints, randResult } = require("../models/mocks");
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
  new Player("Markos Baghdatis"),
  new Player("Grigor Dimitrov"),
  new Player("Kei Nishikori"),
  new Player("Nick Kirgios"),
  new Player("Dominik Thiem"),
  new Player("Marat Safin"),
  new Player("Fabio Fognini"),
  new Player("James Blake"),
  new Player("Alex Dolgopolov"),
  new Player("Juan Monaco"),
];

const liguePlayers = players.map((p) => new LiguePlayer(p));

const champs = [];
champs.push(new Championship("January", 16));
champs.push(new Championship("February", 12));
champs.push(new Championship("March", 10));
champs.push(new Championship("April", 12));
champs.push(new Championship("May", 12));
champs.push(new Championship("June", 9));
champs.push(new Championship("July", 12));
champs.push(new Championship("August", 12));
champs.push(new Championship("September", 16));
champs.push(new Championship("October", 12));
champs.push(new Championship("November", 12));
champs.push(new Championship("December", 9));

const shufflePlayers = (players, capacity) => {
  return [...players].sort(() => 0.5 - Math.random()).slice(0, capacity);
};

for (let c of champs) {
  const entryList = shufflePlayers(liguePlayers, c.capacity);
  for (let lp of entryList) {
    lp.champs.push(c);
  }

  c.points = points;
  c.groupPoints = groupPoints;
  c.entryList = entryList.map((lp) => lp.player);
  c.createGroups();
  c.createDraw();
  c.groups.forEach((g) => {
    g.matches.forEach((m) => {
      m.result = randResult();
    });
  });
  c.groups.forEach((g) => g.players.sort(g.orderPlaces));
  c.groups.forEach((g) => {
    g.orderPlayersByPlace();
  });
  c.addPointsAccordingToPlace();
  c.joinedGroupsResult = c.createJoinedGroupsResult(c.groups);
  c.prepareQualifiersForDraw();
  c.seedDrawPlayers();
  c.startDraw();

  c.draw.matches.forEach((m) => {
    if (m.playersInRound === 16) {
      m.result = randResult();
    }
  });

  c.draw.matches.forEach((m) => {
    if (m.playersInRound === 8) {
      m.result = randResult();
    }
  });

  c.draw.matches.forEach((m) => {
    if (m.playersInRound === 4) {
      m.result = randResult();
    }
  });

  c.draw.matches.forEach((m) => {
    if (m.playersInRound === 2) {
      m.result = randResult();
    }
  });

  c.createTournamentResult();

  for (let cp of c.players) {
    const lp = liguePlayers.find((lp) => lp.player === cp.player);
    lp.points = lp.points + cp.points;
  }
}

liguePlayers.sort((a, b) => {
  return a.points < b.points ? 1 : -1;
});

console.log("");
let place = 0;
console.log("Single Ranking");
console.log("");
for (let lp of liguePlayers) {
  console.log(
    `${++place} ${lp.player.name} - ${lp.points} (${lp.champs.length} champs)`
  );
}

stats();
