const { Player } = require("../models/Player");
const { LiguePlayer } = require("../models/LiguePlayer");
const { Championship } = require("../models/Championship");
const { points, groupPoints, randResult } = require("../models/mocks");

const playerNames = [
  "Roger Federer", "Rafael Nadal", "Novak Djokovic", "Andy Murray",
  "Juan Martin del Potro", "Andy Roddick", "Robin Soderling",
  "Jo-Wilfried Tsonga", "Marin Cilic", "Fernando Verdasco",
  "Fernando Gonzalez", "Gael Monfils", "Gilles Simon",
  "David Ferrer", "Lleyton Hewitt", "Stan Wawrinka",
  "Tommy Robredo", "Juan Carlos Ferrero", "Tomas Berdych",
  "David Nalbandian", "Markos Baghdatis", "Grigor Dimitrov",
  "Kei Nishikori", "Nick Kirgios", "Dominik Thiem",
  "Marat Safin", "Fabio Fognini", "James Blake",
  "Alex Dolgopolov", "Juan Monaco",
];

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
  { name: "December", capacity: 9 },
];

const shufflePlayers = (players, capacity) => {
  return [...players].sort(() => 0.5 - Math.random()).slice(0, capacity);
};

const runChampionship = (c, liguePlayers) => {
  const entryList = shufflePlayers(liguePlayers, c.capacity);
  for (let lp of entryList) {
    lp.champs.push(c);
  }

  c.points = points;
  c.groupPoints = groupPoints;
  c.entryList = entryList.map((lp) => lp.player);
  c.createGroups();
  c.createDraw();

  c.groups.forEach((g) => g.matches.forEach((m) => { m.result = randResult(); }));
  c.groups.forEach((g) => g.players.sort(g.orderPlaces));
  c.groups.forEach((g) => g.orderPlayersByPlace());
  c.addPointsAccordingToPlace();
  c.joinedGroupsResult = c.createJoinedGroupsResult(c.groups);
  c.prepareQualifiersForDraw();
  c.seedDrawPlayers();
  c.startDraw();

  [16, 8, 4, 2].forEach((round) => {
    c.draw.matches.forEach((m) => {
      if (m.playersInRound === round) m.result = randResult();
    });
  });

  c.createTournamentResult();

  for (let cp of c.players) {
    const lp = liguePlayers.find((lp) => lp.player === cp.player);
    lp.points = lp.points + cp.points;
  }
};

describe("Season", () => {
  test("full season runs all championships and produces a ranking", () => {
    const players = playerNames.map((name) => new Player(name));
    const liguePlayers = players.map((player) => new LiguePlayer(player));
    const champs = championshipConfigs.map((cfg) => new Championship(cfg.name, cfg.capacity));

    expect(() => {
      for (let c of champs) {
        runChampionship(c, liguePlayers);
      }
    }).not.toThrow();

    liguePlayers.sort((a, b) => (a.points < b.points ? 1 : -1));
    expect(liguePlayers[0].points).toBeGreaterThanOrEqual(liguePlayers[liguePlayers.length - 1].points);
  });
});
