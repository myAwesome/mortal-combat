const { Player, GroupPlayer, PlayOffPlayer } = require("../models/Player");
const { Match, GroupMatch, PlayOffMatch } = require("../models/Match");
const assert = require("assert");

/** Match  **/
const federer = new Player(1, "Federer");
const nadal = new Player(2, "Nadal");
const match = new Match({
  player1: federer,
  player2: nadal,
});
match.result = "6-1";
assert.strictEqual(match.winner, federer);
assert.strictEqual(match.looser, nadal);

/** GroupMatch  **/
const gFederer = new GroupPlayer(federer);
const gNadal = new GroupPlayer(nadal);
const groupMatch = new GroupMatch({
  player1: gFederer,
  player2: gNadal,
});

groupMatch.result = "6-1";

assert.strictEqual(groupMatch.winner, gFederer);
assert.strictEqual(groupMatch.looser, gNadal);
assert.strictEqual(gFederer.groupMetadata.win, 6);
assert.strictEqual(gFederer.groupMetadata.loose, 1);
assert.strictEqual(gFederer.groupMetadata.points, 1);
assert.strictEqual(gNadal.groupMetadata.win, 1);
assert.strictEqual(gNadal.groupMetadata.loose, 6);
assert.strictEqual(gNadal.groupMetadata.points, 0);

/** PlayOffMatch normal  **/

const pFederer = new PlayOffPlayer(federer);
const pNadal = new PlayOffPlayer(nadal);
const playOffMatch = new PlayOffMatch({
  player1: pFederer,
  player2: pNadal,
});

playOffMatch.result = "7-5";

assert.strictEqual(playOffMatch.winner, pFederer);
assert.strictEqual(playOffMatch.looser, pNadal);
// console.log(playOffMatch);

/** PlayOffMatch Bye  **/

const pJo = new PlayOffPlayer(new Player(3, "Jo"));
const pBye = new PlayOffPlayer(undefined, true);
const playOffMatchBye = new PlayOffMatch({
  player1: pJo,
  player2: pBye,
});

assert.strictEqual(playOffMatchBye.winner, pJo);
assert.strictEqual(playOffMatchBye.looser, pBye);