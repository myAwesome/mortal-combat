const { Draw } = require("../models/Draw");
const { strictEqual, stats } = require("../models/util");

/** Draw  **/
const capacity = 4;
const draw = new Draw(capacity);
strictEqual(draw.capacity, capacity);
// draw.createMatches(capacity);

// console.log(util.inspect(draw.matches, false, null, true));
// console.log(draw.matches);

stats();
