import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import Players from './pages/Players'
import Championships from './pages/Championships'
import ChampionshipDetail from './pages/ChampionshipDetail'
import Ligues from './pages/Ligues'
import LigueDetail from './pages/LigueDetail'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <main className="page-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/players" element={<Players />} />
          <Route path="/championships" element={<Championships />} />
          <Route path="/championships/:id" element={<ChampionshipDetail />} />
          <Route path="/ligues" element={<Ligues />} />
          <Route path="/ligues/:id" element={<LigueDetail />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
