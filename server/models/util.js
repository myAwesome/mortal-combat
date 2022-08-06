const assert = require("assert");

const isOdd = (num) => num % 2;
const colors = {
  success: "\x1b[32m%s\x1b[0m",
  error: "\x1b[31m%s\x1b[0m",
};
let passed = 0;
let failed = 0;
const x = () => {
  return (a, b) => {
    try {
      assert.strictEqual(a, b);
      console.log(colors.success, `Passed: "${a}" strictEqual "${b}"`);
      passed++;
    } catch (e) {
      console.log(colors.error, `Failed: "${a}" is not strictEqual "${b}"`);
      failed++;
    }
  };
};
const strictEqual = x();
const stats = () => {
  console.log("-------------------------");
  if (failed) {
    console.log(colors.error, `Failed: ${failed}`);
  }
  if (passed) {
    console.log(colors.success, `Passed: ${passed}`);
  }
};

module.exports = { isOdd, strictEqual, stats };
