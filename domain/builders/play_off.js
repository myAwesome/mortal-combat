const isOdd = (num) => num % 2;
const DRAW_MAP = {
  2: "Final",
  4: "Semi-Final",
  8: "Quarter-Final",
  16: "Last 16",
  32: "Last 32",
  64: "Last 64",
  128: "Last 128",
};

const matches = [];

const createPlayOffMatches = (draw) => {
  const playersPerRound = [2, 4, 8, 16, 32, 64, 128, 256];
  for (const players of playersPerRound) {
    if (draw.capacity >= players) {
      const playersInRound = players;
      const iterations = players / 2;
      for (let i = 1; i < iterations + 1; i++) {
        const match = {
          playersInRound,
          stage: DRAW_MAP[playersInRound],
          matchNumberInRound: i,
        };

        matches.push(match);
      }
    }
  }
};

const calculateDrawCapacity = (players) =>
  Math.pow(2, Math.ceil(Math.log2(players)));

exports.calculateDrawCapacity = calculateDrawCapacity;
