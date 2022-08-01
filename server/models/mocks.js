const { Player } = require("./Player");

const setResults = [
  "7-6",
  "7-5",
  "6-4",
  "6-3",
  "6-2",
  "6-1",
  "6-0",
  "6-7",
  "5-7",
  "4-6",
  "3-6",
  "2-6",
  "1-6",
  "0-6",
];

const players = [
  new Player(1, "Roger Federer"),
  new Player(2, "Rafael Nadal"),
  new Player(3, "Novak Djokovic"),
  new Player(4, "Andy Murray"),
  new Player(5, "Juan Martin del Potro"),
  new Player(6, "Andy Roddick"),
  new Player(7, "Robin Soderling"),
  new Player(8, "Jo-Wilfried Tsonga"),
  new Player(9, "Marin Cilic"),
  new Player(10, "Fernando Verdasco"),
  new Player(11, "Fernando Gonzalez"),
  new Player(12, "Gael Monfils"),
  new Player(13, "Gilles Simon"),
  new Player(14, "David Ferrer"),
  new Player(15, "Lleyton Hewitt"),
  new Player(16, "Stan Wawrinka"),
  new Player(17, "Tommy Robredo"),
  new Player(18, "Juan Carlos Ferrero"),
  new Player(19, "Tomas Berdych"),
  new Player(20, "David Nalbandian"),
];

const DRAW_MAP = {
  2: "Final",
  4: "Semi-Final",
  8: "Quarter-Final",
  16: "Last 16",
  32: "Last 32",
  64: "Last 64",
  128: "Last 128",
};

const points = {
  1: 2000,
  2: 1200,
  4: 720,
  8: 360,
  16: 180,
  32: 90,
  64: 45,
  "3place": 90,
  "4place": 45,
};

module.exports = {
  points,
  DRAW_MAP,
  players,
  fakeResults: setResults,
};
