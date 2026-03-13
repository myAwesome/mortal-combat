class RankingBuilder {
    build(liguePlayers) {
        return [...liguePlayers]
            .sort((a, b) => b.points - a.points)
            .map((lp, index) => ({
                place: index + 1,
                player: lp.player,
                points: lp.points,
                champsPlayed: lp.champs.length,
            }));
    }
}

module.exports = { RankingBuilder };
