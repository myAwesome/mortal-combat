class PlayOffPlayer {
    player;
    isBye;
    draw;
    location;
    constructor(player, isBye = false, draw, location) {
        this.player = player;
        this.isBye = isBye;
        this.draw = draw;
        this.location = location;
    }
}
module.exports = { PlayOffPlayer };