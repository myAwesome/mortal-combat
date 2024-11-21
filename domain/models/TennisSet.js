class TennisSet {
    p1;
    p2;
    constructor(setString) {
        const [p1, p2] = setString.split("-").map((s) => s * 1);
        this.p1 = p1;
        this.p2 = p2;
    }
}
module.exports = { TennisSet };