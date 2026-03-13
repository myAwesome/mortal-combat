class TennisSet {
    p1;
    p2;

    constructor(setString) {
        if (typeof setString !== "string" || !/^\d+-\d+$/.test(setString)) {
            throw new Error(`Invalid set string: "${setString}"`);
        }
        const [p1, p2] = setString.split("-").map(Number);
        this.p1 = p1;
        this.p2 = p2;
    }

    p1Wins() {
        return this.p1 > this.p2;
    }

    p2Wins() {
        return this.p2 > this.p1;
    }
}
module.exports = { TennisSet };
