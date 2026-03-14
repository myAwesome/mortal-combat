import { NavLink } from 'react-router-dom'
import './NavBar.css'

export default function NavBar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          🎾 Champ
        </NavLink>
        <div className="navbar-links">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/players">Players</NavLink>
          <NavLink to="/championships">Championships</NavLink>
          <NavLink to="/ligues">Ligues</NavLink>
        </div>
      </div>
    </nav>
  )
}
