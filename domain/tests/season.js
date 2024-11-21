console.log(`\n SEASON TEST \n`)

const { stats } = require("../../utils/util");
const { Player } = require("../models/Player");
const { LiguePlayer } = require("../models/LiguePlayer");
const { Championship } = require("../models/Championship");
const { points, groupPoints, randResult } = require("../models/mocks");
// Create players
const players = [
  "Roger Federer", "Rafael Nadal", "Novak Djokovic", "Andy Murray",
  "Juan Martin del Potro", "Andy Roddick", "Robin Soderling",
  "Jo-Wilfried Tsonga", "Marin Cilic", "Fernando Verdasco",
  "Fernando Gonzalez", "Gael Monfils", "Gilles Simon",
  "David Ferrer", "Lleyton Hewitt", "Stan Wawrinka",
  "Tommy Robredo", "Juan Carlos Ferrero", "Tomas Berdych",
  "David Nalbandian", "Markos Baghdatis", "Grigor Dimitrov",
  "Kei Nishikori", "Nick Kirgios", "Dominik Thiem",
  "Marat Safin", "Fabio Fognini", "James Blake",
  "Alex Dolgopolov", "Juan Monaco"
].map(name => new Player(name));

const liguePlayers = players.map(player => new LiguePlayer(player));

// Create championships
const championshipConfigs = [
  { name: "January", capacity: 16 },
  { name: "February", capacity: 12 },
  { name: "March", capacity: 10 },
  { name: "April", capacity: 12 },
  { name: "May", capacity: 12 },
  { name: "June", capacity: 9 },
  { name: "July", capacity: 12 },
  { name: "August", capacity: 12 },
  { name: "September", capacity: 16 },
  { name: "October", capacity: 12 },
  { name: "November", capacity: 12 },
  { name: "December", capacity: 9 }
];
const champs = championshipConfigs.map(cfg => new Championship(cfg.name, cfg.capacity));


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
console.log(`\n Single Ranking \n`)

console.log("");
for (let lp of liguePlayers) {
  console.log(
    `${++place} ${lp.player.name} - ${lp.points} (${lp.champs.length} champs)`
  );
}

stats();
