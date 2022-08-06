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

const placesPriority = (capacity) => {
  const places = [...Array(capacity).keys()].map((i) => i + 1);
  const splitedPlaces = [];
  const seedPlaces = [];

  // todo: оптимізувати/ зробити хоч якось читаємим
  const rf = (list) => {
    if (list.length <= 2) return;
    splitedPlaces.push([...list]);
    const middleIndex = Math.ceil(list.length / 2);
    const firstHalf = list.splice(0, middleIndex);
    const secondHalf = list.splice(-middleIndex);
    rf(firstHalf);
    rf(secondHalf);
  };

  rf(places);
  splitedPlaces.sort((b, a) => {
    if (a.length > b.length) {
      return 1;
    }
    if (a.length < b.length) {
      return -1;
    }
    return 0;
  });

  splitedPlaces.forEach((el) => {
    if (!seedPlaces.includes(el[0])) {
      seedPlaces.push(el[0]);
    }
    if (!seedPlaces.includes(el[el.length - 1])) {
      seedPlaces.push(el[el.length - 1]);
    }
  });

  const placesPriority = [...seedPlaces];
  for (let i = seedPlaces.length - 1; i >= 0; i--) {
    placesPriority.push(
      isOdd(seedPlaces[i]) ? seedPlaces[i] + 1 : seedPlaces[i] - 1
    );
  }

  return placesPriority;
};

exports.placesPriority = placesPriority;
exports.calculateDrawCapacity = calculateDrawCapacity;
