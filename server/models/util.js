const assert = require("assert");

const isOdd = (num) => num % 2;
let passed = 0;
let failed = 0;
const x = () => {
  return (a, b) => {
    try {
      assert.strictEqual(a, b);
      console.log("\x1b[32m%s\x1b[0m", `Passed: ${a} strictEqual ${b}`);
      passed++;
    } catch (e) {
      console.log("\x1b[31m%s\x1b[0m", `Failed: ${a} is not strictEqual ${b}`);
      failed++;
    }
  };
};
const strictEqual = x();
const stats = () => {
  console.log("-------------------------");
  if (failed) {
    console.log("\x1b[31m%s\x1b[0m", `Failed: ${failed}`);
  }
  if (passed) {
    console.log("\x1b[32m%s\x1b[0m", `Passed: ${passed}`);
  }
};

module.exports = { isOdd, strictEqual, stats };
