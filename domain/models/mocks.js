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
};
const groupPoints = {
  1: 0,
  2: 0,
  3: 90,
  4: 45,
};
const randResult = () =>
  setResults[Math.floor(Math.random() * setResults.length)];

module.exports = {
  points,
  groupPoints,
  DRAW_MAP,
  fakeResults: setResults,
  randResult,
};
