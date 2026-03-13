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

const shufflePlayers = (players, capacity) => {
  return [...players].sort(() => 0.5 - Math.random()).slice(0, capacity);
};

describe("Championship", () => {
  let usOpen;
  let shuffledPlayers;

  beforeEach(() => {
    usOpen = new Championship("Us Open 2008", 9);
    usOpen.points = points;
    usOpen.groupPoints = groupPoints;
    shuffledPlayers = shufflePlayers(players, usOpen.capacity);
    usOpen.entryList = shuffledPlayers;
  });

  test("has correct name and capacity", () => {
    expect(usOpen.name).toBe("Us Open 2008");
    expect(usOpen.capacity).toBe(9);
  });

  test("entryList sets players correctly", () => {
    expect(usOpen.players.length).toBe(shuffledPlayers.length);
  });

  test("createGroups creates 3 groups starting with A", () => {
    usOpen.createGroups();
    expect(usOpen.groups.length).toBe(3);
    expect(usOpen.groups[0].name).toBe("A");
  });

  test("joinedGroupsResult is sorted by place ascending", () => {
    usOpen.createGroups();
    usOpen.createDraw();

    usOpen.groups.forEach((g) => {
      g.matches.forEach((m) => {
        m.result = randResult();
      });
    });

    usOpen.groups.forEach((g) => g.players.sort(g.orderPlaces));
    usOpen.groups.forEach((g) => g.orderPlayersByPlace());
    usOpen.addPointsAccordingToPlace();

    usOpen.joinedGroupsResult = usOpen.createJoinedGroupsResult(usOpen.groups);

    expect(usOpen.joinedGroupsResult[0].groupMetadata.place).toBe(1);
    usOpen.joinedGroupsResult.forEach((p, i, arr) => {
      if (arr[i + 1]) {
        expect(p.groupMetadata.place <= arr[i + 1].groupMetadata.place).toBe(true);
      }
    });
  });

  test("prepareQualifiersForDraw adds bye players at the end", () => {
    usOpen.createGroups();
    usOpen.createDraw();

    usOpen.groups.forEach((g) => {
      g.matches.forEach((m) => {
        m.result = randResult();
      });
    });

    usOpen.groups.forEach((g) => g.players.sort(g.orderPlaces));
    usOpen.groups.forEach((g) => g.orderPlayersByPlace());
    usOpen.addPointsAccordingToPlace();

    usOpen.joinedGroupsResult = usOpen.createJoinedGroupsResult(usOpen.groups);
    usOpen.prepareQualifiersForDraw();

    const last = usOpen.qualifiersAndBye.length - 1;
    expect(usOpen.qualifiersAndBye[last].player.name).toBe("bye");
    expect(usOpen.qualifiersAndBye[last - 1].player.name).toBe("bye");
  });

  test("full championship run completes without errors", () => {
    usOpen.createGroups();
    usOpen.createDraw();

    usOpen.groups.forEach((g) => {
      g.matches.forEach((m) => {
        m.result = randResult();
      });
    });

    usOpen.groups.forEach((g) => g.players.sort(g.orderPlaces));
    usOpen.groups.forEach((g) => g.orderPlayersByPlace());
    usOpen.addPointsAccordingToPlace();

    usOpen.joinedGroupsResult = usOpen.createJoinedGroupsResult(usOpen.groups);
    usOpen.prepareQualifiersForDraw();
    usOpen.seedDrawPlayers();
    usOpen.startDraw();

    usOpen.draw.matches.forEach((m) => {
      if (m.playersInRound === 8) m.result = randResult();
    });
    usOpen.draw.matches.forEach((m) => {
      if (m.playersInRound === 4) m.result = randResult();
    });
    usOpen.draw.matches.forEach((m) => {
      if (m.playersInRound === 2) m.result = randResult();
    });

    expect(() => usOpen.createTournamentResult()).not.toThrow();
  });
});
