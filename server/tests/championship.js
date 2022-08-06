const { strictEqual, stats } = require("../models/util");
const { Championship } = require("../models/Championship");
const { players } = require("../models/mocks");

// todo: to mocks or to tests
const shufflePlayers = (players, capacity) => {
  return [...players].sort(() => 0.5 - Math.random()).slice(0, capacity);
};

const smash750 = new Championship("Smash 750", 16);
strictEqual(smash750.name, "Smash 750");
strictEqual(smash750.capacity, 16);

const shuffledPlayers = shufflePlayers(players, smash750.capacity);
smash750.entryList = shuffledPlayers;
strictEqual(smash750.players.length, shuffledPlayers.length);

smash750.createGroups();

// todo: test createJoinedGroupsResult

strictEqual(smash750.groups.length, 5);
strictEqual(smash750.groups[0].name, "A");

/**

 // smash750.draw.fillMatches(smash750.drawPlayersWithLocation);
 // 8. mock play-off
 // smash750.draw.handleRounds();
 **/

stats();
