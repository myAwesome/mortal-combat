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
