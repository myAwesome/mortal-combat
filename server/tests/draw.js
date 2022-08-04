const { Draw } = require("../models/Draw");
const assert = require("assert");
const util = require("util");

console.log("          ");
console.log("          ");
console.log("          ");
console.log("          ");

/** Draw  **/
const capacity = 4;
const draw = new Draw(capacity);
assert.strictEqual(draw.capacity, capacity);
draw.createMatches(capacity);

console.log(util.inspect(draw.matches, false, null, true));
// console.log(draw.matches);
