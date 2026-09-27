import { Link, useNavigate } from 'react-router-dom'
import { Plus, Activity, GitCompare, FileText } from 'lucide-react'
import { useProject } from '../store/ProjectContext'
import StatCard from '../components/StatCard'

export default function Dashboard() {
  const { projects, load } = useProject()
  const nav = useNavigate()

  const withResults = projects.filter((p) => p.results)
  const avgIndoor = withResults.length
    ? withResults.reduce((s, p) => s + (p.results?.avgIndoorTempC ?? 0), 0) / withResults.length
    : null
  const avgEfficiency = withResults.length
    ? withResults.reduce((s, p) => s + (p.results?.thermalEfficiencyPct ?? 0), 0) / withResults.length
    : null
  const avgHeatLoss = withResults.length
    ? withResults.reduce((s, p) => s + (p.results?.totalHeatLossKWh ?? 0), 0) / withResults.length
    : null
  const avgSolar = withResults.length
    ? withResults.reduce((s, p) => s + (p.results?.totalSolarGainKWh ?? 0), 0) / withResults.length
    : null

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-700 text-2xl">Dashboard</h1>
          <p className="text-sm text-slate mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} saved locally</p>
        </div>
        <div className="flex gap-2">
          <Link to="/new-project" className="flex items-center gap-1.5 bg-ice text-base text-sm font-medium px-3.5 py-2 rounded-md hover:bg-ice2">
            <Plus size={15} /> New Shelter
          </Link>
          <Link to="/simulation" className="flex items-center gap-1.5 border border-line text-sm px-3.5 py-2 rounded-md hover:border-ice/40">
            <Activity size={15} /> Run Simulation
          </Link>
          <Link to="/comparison" className="flex items-center gap-1.5 border border-line text-sm px-3.5 py-2 rounded-md hover:border-ice/40">
            <GitCompare size={15} /> Compare
          </Link>
          <Link to="/report" className="flex items-center gap-1.5 border border-line text-sm px-3.5 py-2 rounded-md hover:border-ice/40">
            <FileText size={15} /> Report
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Avg Indoor Temp" value={avgIndoor !== null ? avgIndoor.toFixed(1) : '—'} unit="°C" accent="ice" />
        <StatCard label="Thermal Efficiency" value={avgEfficiency !== null ? avgEfficiency.toFixed(0) : '—'} unit="%" accent="ice" />
        <StatCard label="Avg Solar Gain" value={avgSolar !== null ? avgSolar.toFixed(1) : '—'} unit="kWh" accent="ember" />
        <StatCard label="Avg Heat Loss" value={avgHeatLoss !== null ? avgHeatLoss.toFixed(1) : '—'} unit="kWh" accent="ember" />
      </div>

      <div className="font-display font-600 text-sm text-slate mb-3">Recent Projects</div>
      {projects.length === 0 ? (
        <div className="border border-dashed border-line rounded-lg p-10 text-center text-slate">
          No projects yet. <Link to="/new-project" className="text-ice2 underline">Create your first shelter design</Link>.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => { load(p); nav('/designer') }}
              className="text-left border border-line rounded-lg p-4 bg-panel hover:border-ice/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="font-display font-600">{p.name}</div>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-line text-slate">{p.results ? 'Simulated' : 'Draft'}</span>
              </div>
              <div className="text-xs text-slate mt-1">{p.location.name} · {p.shelterType}</div>
              {p.results && (
                <div className="flex gap-4 mt-3 data-num text-xs">
                  <span className="text-ice2">{p.results.avgIndoorTempC.toFixed(1)}°C indoor</span>
                  <span className="text-ember2">{p.results.thermalEfficiencyPct.toFixed(0)}% efficiency</span>
                  <span className="text-slate">{p.results.comfortHoursPct.toFixed(0)}% comfort hrs</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
