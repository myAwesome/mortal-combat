const {Match} = require("./Match");

class GroupMatch extends Match {
    constructor(obj) {
        super(obj);
    }

    updateMetadataAfterMatch = () => {
        const p1 = this.result.p1,
            p2 = this.result.p2;
        this.player1.groupMetadata.win += p1;
        this.player1.groupMetadata.loose += p2;
        this.player2.groupMetadata.win += p2;
        this.player2.groupMetadata.loose += p1;
        p1 > p2
            ? ++this.player1.groupMetadata.points
            : ++this.player2.groupMetadata.points;
    };
}

module.exports = { GroupMatch };
