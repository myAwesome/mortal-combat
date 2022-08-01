const util = require("util");
const { Championship } = require("../models/Championship");
const { PlayOffMatch } = require("../models/Match");
const { players, fakeResults, DRAW_MAP } = require("../models/mocks");

// todo: to mocks or to tests
const shufflePlayers = (players, capacity) => {
  return [...players].sort(() => 0.5 - Math.random()).slice(0, capacity);
};

const australianOpen = new Championship(1, "australian open", 16, true);
australianOpen.entryList = shufflePlayers(players, australianOpen.capacity);
australianOpen.createGroups();

australianOpen.draw.fillMatches(australianOpen.drawPlayersWithLocation);
// 8. mock play-off
australianOpen.draw.handleRounds();
// console.log(util.inspect(australianOpen, false, null, true));
