const { Player } = require("../models/Player");
const { GroupPlayer } = require("../models/GroupPlayer");
const { PlayOffPlayer } = require("../models/PlayOffPlayer");
const { Match } = require("../models/Match");
const { GroupMatch } = require("../models/GroupMatch");
const { PlayOffMatch } = require("../models/PlayOffMatch");
const { Draw } = require("../models/Draw");

describe("Match", () => {
  test("winner and loser are set correctly", () => {
    const federer = new Player("Federer");
    const nadal = new Player("Nadal");
    const match = new Match({ player1: federer, player2: nadal });
    match.result = "6-1";
    expect(match.winner).toBe(federer);
    expect(match.loser).toBe(nadal);
  });
});

describe("GroupMatch", () => {
  test("winner, loser and stats are updated correctly", () => {
    const gFederer = new GroupPlayer(new Player("Federer"));
    const gNadal = new GroupPlayer(new Player("Nadal"));
    const groupMatch = new GroupMatch({ player1: gFederer, player2: gNadal });
    groupMatch.result = "6-1";

    expect(groupMatch.winner).toBe(gFederer);
    expect(groupMatch.loser).toBe(gNadal);
    expect(gFederer.groupMetadata.win).toBe(6);
    expect(gFederer.groupMetadata.loose).toBe(1);
    expect(gFederer.groupMetadata.points).toBe(1);
    expect(gNadal.groupMetadata.win).toBe(1);
    expect(gNadal.groupMetadata.loose).toBe(6);
    expect(gNadal.groupMetadata.points).toBe(0);
  });
});

describe("PlayOffMatch", () => {
  test("bye match: non-bye player wins automatically", () => {
    const draw = new Draw(2);
    const pJo = new PlayOffPlayer(new Player("Jo"));
    const pBye = new PlayOffPlayer(undefined, true);
    const playOffMatchBye = new PlayOffMatch({ player1: pJo, player2: pBye, draw });

    expect(playOffMatchBye.winner).toBe(pJo);
    expect(playOffMatchBye.loser).toBe(pBye);
  });

  test("normal match advances winner and loser to next matches", () => {
    const draw2 = new Draw(4);
    const pFederer = new PlayOffPlayer(new Player("Federer"));
    const pNadal = new PlayOffPlayer(new Player("Nadal"));
    const nextMatchForLoser = new PlayOffMatch();
    const nextMatchForWinner = new PlayOffMatch();

    const playOffMatch = new PlayOffMatch({
      player1: pFederer,
      player2: pNadal,
      nextMatchForLoser,
      nextMatchForWinner,
      draw: draw2,
    });
    playOffMatch.result = "7-5";

    expect(playOffMatch.winner).toBe(pFederer);
    expect(playOffMatch.loser).toBe(pNadal);
    expect(playOffMatch.nextMatchForWinner.hasPlayer(pFederer.player)).toBe(true);
    expect(playOffMatch.nextMatchForLoser.hasPlayer(pNadal.player)).toBe(true);
  });
});
