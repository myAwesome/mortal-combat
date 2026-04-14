import { Link } from 'react-router-dom'
import './PlayerLink.css'

export default function PlayerLink({ player }) {
    return (
        <Link to={`/players/${player.id}`} className="player-link" onClick={(e) => e.stopPropagation()}>
            {player.name}
        </Link>
    )
}
