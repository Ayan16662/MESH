import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProject } from '../store/ProjectContext'
import StatCard from '../components/StatCard'
import { generateAnalysis } from '../lib/aiAnalysis'
import { Sparkles, Bot, Loader2 } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const gridColor = '#1E2A3D'
const axisColor = '#7C8AA3'

export default function Results() {
  const { project } = useProject()
  const r = project.results

  if (!r) {
    return (
      <div className="p-8 max-w-4xl">
        <h1 className="font-display font-700 text-2xl mb-3">Simulation Results</h1>
        <div className="border border-dashed border-line rounded-lg p-10 text-center text-slate">
          No results yet. <Link to="/simulation" className="text-ice2 underline">Run a simulation first</Link>.
        </div>
      </div>
    )
  }

  const chartData = r.hourly.map((h) => ({
    hour: h.hour,
    Indoor: Number(h.indoorTempC.toFixed(2)),
    Outdoor: Number(h.outdoorTempC.toFixed(2)),
    Solar: Number(h.solarGainW.toFixed(0)),
    Conduction: Number(h.conductionLossW.toFixed(0)),
    Ventilation: Number(h.ventilationLossW.toFixed(0)),
    Infiltration: Number(h.infiltrationLossW.toFixed(0)),
    Internal: Number(h.internalGainW.toFixed(0)),
    Net: Number(h.netHeatFlowW.toFixed(0)),
  }))

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-700 text-2xl">Simulation Results</h1>
          <p className="text-sm text-slate mt-1">{project.name} · {project.simulationSettings.date}</p>
        </div>
        <Link to="/report" className="text-sm border border-line px-4 py-2 rounded-md hover:border-ice/40">Generate Report →</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Avg Indoor Temp" value={r.avgIndoorTempC.toFixed(1)} unit="°C" accent="ice" />
        <StatCard label="Avg Outdoor Temp" value={r.avgOutdoorTempC.toFixed(1)} unit="°C" />
        <StatCard label="Comfort Hours" value={r.comfortHoursPct.toFixed(0)} unit="%" accent="ice" hint={`${r.belowComfortPct.toFixed(0)}% below · ${r.aboveComfortPct.toFixed(0)}% above`} />
        <StatCard label="Thermal Efficiency" value={r.thermalEfficiencyPct.toFixed(0)} unit="%" accent="ice" />
        <StatCard label="Total Solar Gain" value={r.totalSolarGainKWh.toFixed(1)} unit="kWh" accent="ember" />
        <StatCard label="Total Heat Loss" value={r.totalHeatLossKWh.toFixed(1)} unit="kWh" accent="ember" />
        <StatCard label="Peak Heat Loss" value={r.peakHeatLossW.toFixed(0)} unit="W" accent="ember" />
        <StatCard label="Est. Energy Required" value={r.energyRequirementKWh.toFixed(1)} unit="kWh" accent="ember" />
      </div>

      <ChartPanel title="Indoor vs Outdoor Temperature">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
            <XAxis dataKey="hour" stroke={axisColor} fontSize={11} label={{ value: 'Hour', position: 'insideBottom', offset: -5, fill: axisColor, fontSize: 11 }} />
            <YAxis stroke={axisColor} fontSize={11} unit="°C" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Indoor" stroke="#4FD1E8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Outdoor" stroke="#F2733B" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <div className="grid md:grid-cols-2 gap-5 mt-5">
        <ChartPanel title="Solar Radiation Gain">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="hour" stroke={axisColor} fontSize={11} />
              <YAxis stroke={axisColor} fontSize={11} unit="W" />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="Solar" stroke="#F5D742" fill="#F5D74233" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Heat Loss by Component">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="hour" stroke={axisColor} fontSize={11} />
              <YAxis stroke={axisColor} fontSize={11} unit="W" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Conduction" stackId="a" fill="#F2733B" />
              <Bar dataKey="Ventilation" stackId="a" fill="#F5966A" />
              <Bar dataKey="Infiltration" stackId="a" fill="#7C8AA3" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Thermal Energy Balance">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="hour" stroke={axisColor} fontSize={11} />
              <YAxis stroke={axisColor} fontSize={11} unit="W" />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="Net" stroke="#4FD1E8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Occupancy Internal Heat Gain">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="hour" stroke={axisColor} fontSize={11} />
              <YAxis stroke={axisColor} fontSize={11} unit="W" />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="Internal" stroke="#4FD1E8" fill="#4FD1E833" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      {/* AI Thermal Analysis Section */}
      <AiAnalysisSection project={project} />
    </div>
  )
}

function AiAnalysisSection({ project }: { project: any }) {
  const [analysis, setAnalysis] = useState<{ text: string; source: 'ai' | 'rule-based' } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    const res = await generateAnalysis(project)
    setAnalysis(res)
    setLoading(false)
  }

  return (
    <div className="mt-6 border border-line rounded-lg bg-panel p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-ice" />
            <h2 className="font-display font-700 text-lg">AI Engineering Analysis</h2>
          </div>
          <p className="text-xs text-slate mt-0.5">Automated building-physics design review grounded in simulation results</p>
        </div>
        {!analysis && (
          <button onClick={handleGenerate} disabled={loading} className="flex items-center gap-2 bg-ice text-base px-4 py-2 rounded-md text-xs font-medium hover:bg-ice2 transition-colors">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
            {loading ? 'Analyzing Physics…' : 'Generate AI Analysis'}
          </button>
        )}
      </div>

      {analysis && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate border-b border-line pb-2">
            <span className="uppercase tracking-wider font-semibold text-ice2">
              {analysis.source === 'ai' ? '🤖 LLM-Powered Analysis (OpenAI/Gemini)' : '⚡ Rule-Based Deterministic Physics Memo'}
            </span>
            <button onClick={handleGenerate} className="text-xs text-ice hover:underline flex items-center gap-1">
              <Bot size={12} /> Regenerate
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-frost bg-panel2 p-4 rounded-md border border-line/60">
            {analysis.text}
          </pre>
        </div>
      )}
    </div>
  )
}


const tooltipStyle = { background: '#111A28', border: '1px solid #1E2A3D', borderRadius: 6, fontSize: 12 }

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-line rounded-md bg-panel p-4">
      <div className="font-display font-600 text-sm mb-2">{title}</div>
      {children}
    </div>
  )
}
