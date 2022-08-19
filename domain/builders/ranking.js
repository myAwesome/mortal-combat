/**
 public function build(Ranking $ranking)
 {
        $conn = $this->em->getConnection();

        $sql = '
            SELECT
                p.*,
                sum(cp.points) as points,
                count(c.id) as champs_played
            FROM
                champ.player p
            join championat_player cp on cp.player_id = p.id
            join championat c on c.id = cp.championat_id
            where c.ranking_id = '.$ranking->getId().'
            group by p.id
            order by sum(cp.points) desc;
        ';

        return $conn->fetchAll($sql);
    }
 **/
