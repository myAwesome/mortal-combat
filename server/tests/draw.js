const { Draw } = require("../models/Draw");
const { strictEqual, stats } = require("../models/util");

/** Draw  **/
const draw8 = new Draw(8);
strictEqual(draw8.capacity, 8);
draw8.createMatches(8);
strictEqual(draw8.matches.size, 12);

const draw16 = new Draw(16);
draw16.createMatches(16);
strictEqual(draw16.matches.size, 32);

const draw32 = new Draw(32);
draw32.createMatches(32);
strictEqual(draw32.matches.size, 80);

const draw64 = new Draw(64);
draw64.createMatches(64);
strictEqual(draw64.matches.size, 192);

const placesPriority = Draw.calcPlacesPriority(8);

strictEqual(placesPriority[0], 1);
strictEqual(placesPriority[1], 8);
strictEqual(placesPriority[2], 4);
strictEqual(placesPriority[3], 5);
strictEqual(placesPriority[4], 6);
strictEqual(placesPriority[5], 3);
strictEqual(placesPriority[6], 7);
strictEqual(placesPriority[7], 2);

stats();
