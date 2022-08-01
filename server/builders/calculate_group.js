// todo: convert to test

/**
const items = [
  {
    player: { id: 16, name: "Stan Wawrinka" },
    points: 0,
    groupMethadata: { points: 1, win: 14, loose: 17 },
  },
  {
    player: { id: 4, name: "Andy Murray" },
    points: 0,
    groupMethadata: { points: 3, win: 19, loose: 11 },
  },
  {
    player: { id: 13, name: "Gilles Simon" },
    points: 0,
    groupMethadata: { points: 1, win: 14, loose: 15 },
  },
  {
    player: { id: 17, name: "Tommy Robredo" },
    points: 0,
    groupMethadata: { points: 1, win: 13, loose: 17 },
  },
];

function orderPlaces(a, b) {
  const { groupMethadata: agm } = a;
  const { groupMethadata: bgm } = b;
  if (agm.points > bgm.points) {
    return -1;
  }
  if (agm.points < bgm.points) {
    return 1;
  }

  // compare diffs
  if (agm.win - agm.loose > bgm.win - bgm.loose) {
    return -1;
  }

  if (agm.win - agm.loose < bgm.win - bgm.loose) {
    return 1;
  }
  // todo: особиста зустріч
  return 0;
}

items.sort(orderPlaces);

 **/
