const { Group } = require("../models/Group");
const { Player } = require("../models/Player");
const { GroupPlayer } = require("../models/GroupPlayer");

describe("Group", () => {
  let groupA, kei, jo, ivo;

  beforeEach(() => {
    groupA = new Group("A");
    groupA.capacity = 3;
    kei = new GroupPlayer(new Player("Kei"));
    jo = new GroupPlayer(new Player("Jo"));
    ivo = new GroupPlayer(new Player("Ivo"));
  });

  test("addPlayer adds player and sets group metadata", () => {
    groupA.addPlayer(kei);
    expect(groupA.players.includes(kei)).toBe(true);
    expect(kei.groupMetadata.group).toBe("A");
  });

  test("addPlayer throws when over capacity", () => {
    groupA.addPlayer(kei);
    groupA.addPlayer(jo);
    groupA.addPlayer(ivo);
    expect(() => {
      const kutuzov = new GroupPlayer(new Player("kutuzov"));
      groupA.addPlayer(kutuzov);
    }).toThrow();
  });

  test("createMatches creates 3 matches for 3 players", () => {
    groupA.addPlayer(kei);
    groupA.addPlayer(jo);
    groupA.addPlayer(ivo);
    groupA.createMatches();
    expect(groupA.matches.length).toBe(3);
  });

  test("orderPlayersByPlace assigns correct places after results", () => {
    groupA.addPlayer(kei);
    groupA.addPlayer(jo);
    groupA.addPlayer(ivo);
    groupA.createMatches();

    groupA.matches.forEach((m) => {
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

    expect(kei.groupMetadata.place).toBe(1);
    expect(jo.groupMetadata.place).toBe(2);
    expect(ivo.groupMetadata.place).toBe(3);
  });
});
