class TennisSet {
  p1;
  p2;
  p1Sets;
  p2Sets;
  sets;
  raw;

  constructor(scoreString, setsToWin = 1) {
    if (![1, 2, 3].includes(Number(setsToWin))) {
      throw new Error(`Invalid setsToWin: "${setsToWin}"`);
    }
    if (typeof scoreString !== "string" || scoreString.trim().length === 0) {
      throw new Error(`Invalid score string: "${scoreString}"`);
    }

    const normalized = scoreString.trim().replace(/\s+/g, " ");
    const setParts = normalized.split(" ");
    const maxSets = setsToWin * 2 - 1;
    if (setParts.length < setsToWin || setParts.length > maxSets) {
      throw new Error(
        `Invalid number of sets for setsToWin=${setsToWin}: "${scoreString}"`
      );
    }

    this.p1 = 0;
    this.p2 = 0;
    this.p1Sets = 0;
    this.p2Sets = 0;
    this.sets = [];
    this.raw = normalized;

    for (let i = 0; i < setParts.length; i++) {
      const part = setParts[i];
      if (!/^\d+-\d+$/.test(part)) {
        throw new Error(`Invalid set string: "${part}"`);
      }

      const [p1, p2] = part.split("-").map(Number);
      if (p1 === p2) {
        throw new Error(`Set cannot end in a tie: "${part}"`);
      }

      this.sets.push({ p1, p2 });
      this.p1 += p1;
      this.p2 += p2;
      if (p1 > p2) this.p1Sets++;
      else this.p2Sets++;

      const p1WonMatch = this.p1Sets === setsToWin;
      const p2WonMatch = this.p2Sets === setsToWin;
      if ((p1WonMatch || p2WonMatch) && i < setParts.length - 1) {
        throw new Error(`Match already decided before last set: "${scoreString}"`);
      }
    }

    if (this.p1Sets !== setsToWin && this.p2Sets !== setsToWin) {
      throw new Error(`No player reached setsToWin=${setsToWin}: "${scoreString}"`);
    }
  }

  p1Wins() {
    return this.p1Sets > this.p2Sets;
  }

  p2Wins() {
    return this.p2Sets > this.p1Sets;
  }

  toString() {
    return this.raw;
  }
}
module.exports = { TennisSet };
