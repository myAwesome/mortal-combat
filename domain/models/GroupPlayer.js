const {GroupMetadata} = require("./GroupMetadata");

class GroupPlayer {
    player;
    groupMetadata;
    constructor(player) {
        this.player = player;
        this.groupMetadata = new GroupMetadata();
    }
}

module.exports = { GroupPlayer };
