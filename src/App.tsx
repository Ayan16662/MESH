import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import NewProject from './pages/NewProject'
import Designer from './pages/Designer'
import Simulation from './pages/Simulation'
import Results from './pages/Results'
import Comparison from './pages/Comparison'
import Report from './pages/Report'
import Projects from './pages/Projects'
import Settings from './pages/Settings'
import MapExplorer from './pages/MapExplorer'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Nav />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Shell><Dashboard /></Shell>} />
      <Route path="/new-project" element={<Shell><NewProject /></Shell>} />
      <Route path="/designer" element={<Shell><Designer /></Shell>} />
      <Route path="/simulation" element={<Shell><Simulation /></Shell>} />
      <Route path="/results" element={<Shell><Results /></Shell>} />
      <Route path="/comparison" element={<Shell><Comparison /></Shell>} />
      <Route path="/report" element={<Shell><Report /></Shell>} />
      <Route path="/projects" element={<Shell><Projects /></Shell>} />
      <Route path="/settings" element={<Shell><Settings /></Shell>} />
      <Route path="/map" element={<Shell><MapExplorer /></Shell>} />
    </Routes>
  )
}
