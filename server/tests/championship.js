const { strictEqual, stats } = require("../models/util");
const { Championship } = require("../models/Championship");
const { players, fakeResults } = require("../models/mocks");

const shufflePlayers = (players, capacity) => {
  return [...players].sort(() => 0.5 - Math.random()).slice(0, capacity);
};

const smash750 = new Championship("Smash 750", 9);
strictEqual(smash750.name, "Smash 750");
strictEqual(smash750.capacity, 9);

const shuffledPlayers = shufflePlayers(players, smash750.capacity);
smash750.entryList = shuffledPlayers;
strictEqual(smash750.players.length, shuffledPlayers.length);

smash750.createGroups();
strictEqual(smash750.groups.length, 3);
strictEqual(smash750.groups[0].name, "A");

smash750.createDraw();

// fill group results
smash750.groups.forEach((g) => {
  g.matches.forEach((m) => {
    m.result = fakeResults[Math.floor(Math.random() * fakeResults.length)];
  });
});

// tested in group test
smash750.groups.forEach((g) => g.players.sort(g.orderPlaces));
smash750.groups.forEach((g) => {
  g.players.forEach((p, i) => {
    p.groupMetadata.place = i + 1;
  });
});

smash750.joinedGroupsResult = smash750.createJoinedGroupsResult(
  smash750.groups
);

strictEqual(smash750.joinedGroupsResult[0].groupMetadata.place, 1);
smash750.joinedGroupsResult.forEach((p, i, arr) => {
  if (arr[i + 1]) {
    strictEqual(p.groupMetadata.place <= arr[i + 1].groupMetadata.place, true);
  }
});
smash750.prepareQualifiersForDraw();

strictEqual(
  smash750.qualifiersAndBye[smash750.qualifiersAndBye.length - 1].player.name,
  "bye"
);
strictEqual(
  smash750.qualifiersAndBye[smash750.qualifiersAndBye.length - 2].player.name,
  "bye"
);

smash750.seedDrawPlayers();
console.log(smash750.drawPlayersWithLocation);

// todo: test for seedDrawPlayers

/**
 // smash750.draw.fillMatches(smash750.drawPlayersWithLocation);
 // 8. mock play-off
 // smash750.draw.handleRounds();
 **/

stats();
