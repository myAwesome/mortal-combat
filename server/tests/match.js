const { Player, GroupPlayer, PlayOffPlayer } = require("../models/Player");
const { Match, GroupMatch, PlayOffMatch } = require("../models/Match");
const { strictEqual, stats } = require("../models/util");

/** Match  **/
const federer = new Player("Federer");
const nadal = new Player("Nadal");
const match = new Match({
  player1: federer,
  player2: nadal,
});
match.result = "6-1";
strictEqual(match.winner, federer);
strictEqual(match.looser, nadal);

/** GroupMatch  **/
const gFederer = new GroupPlayer(new Player("Federer"));
const gNadal = new GroupPlayer(new Player("Nadal"));
const groupMatch = new GroupMatch({
  player1: gFederer,
  player2: gNadal,
});

groupMatch.result = "6-1";

strictEqual(groupMatch.winner, gFederer);
strictEqual(groupMatch.looser, gNadal);
strictEqual(gFederer.groupMetadata.win, 6);
strictEqual(gFederer.groupMetadata.loose, 1);
strictEqual(gFederer.groupMetadata.points, 1);
strictEqual(gNadal.groupMetadata.win, 1);
strictEqual(gNadal.groupMetadata.loose, 6);
strictEqual(gNadal.groupMetadata.points, 0);

/** PlayOffMatch Bye  **/
const pJo = new PlayOffPlayer(new Player("Jo"));
const pBye = new PlayOffPlayer(undefined, true);
const playOffMatchBye = new PlayOffMatch({
  player1: pJo,
  player2: pBye,
});

strictEqual(playOffMatchBye.winner, pJo);
strictEqual(playOffMatchBye.looser, pBye);

/** PlayOffMatch normal  **/
const pFederer = new PlayOffPlayer(new Player("Federer"));
const pNadal = new PlayOffPlayer(new Player("Nadal"));
const nextMatchForLooser = new PlayOffMatch();
const nextMatchForWinner = new PlayOffMatch();

const playOffMatch = new PlayOffMatch({
  player1: pFederer,
  player2: pNadal,
  nextMatchForLooser,
  nextMatchForWinner,
});

playOffMatch.result = "7-5";

strictEqual(playOffMatch.winner, pFederer);
strictEqual(playOffMatch.looser, pNadal);

strictEqual(playOffMatch.nextMatchForWinner.hasPlayer(pFederer.player), true);
strictEqual(playOffMatch.nextMatchForLooser.hasPlayer(pNadal.player), true);

stats();
