import { Link } from 'react-router-dom'
import {
  ArrowRight, Sun, Wind, Layers, Box, Map as MapIcon,
  LineChart, Thermometer, Activity, GitCompare,
  ChevronRight, Snowflake, Mountain, ShieldCheck, Cpu,
} from 'lucide-react'

const features = [
  { icon: Thermometer, title: 'Physics-based simulation', body: '5R1C-style hourly thermal engine — solar gain, conduction, ventilation, infiltration. Every number from a formula.' },
  { icon: MapIcon, title: 'Area-specific climate', body: 'Click any point on earth. Live weather via Open-Meteo, automatic elevation correction, offline Ladakh fallback.' },
  { icon: Box, title: 'Interactive 3D designer', body: 'Real-time Three.js shelter model that responds to every dimension change. Thermal, solar, ventilation, and wireframe views.' },
  { icon: Layers, title: 'Multi-layer materials', body: 'DRDO & Military insulation library — Silica Aerogel, Vacuum Insulation Panels (VIP), Paraffin PCM tiles, Neopor EPS.' },
  { icon: Wind, title: 'Ventilation & occupancy', body: 'ACH, window opening fraction, infiltration, and occupant heat gain — all integrated into the thermal balance.' },
  { icon: GitCompare, title: 'Design comparison', body: 'Run multiple configurations, compare indoor temperature, heat loss, comfort hours, and material thickness side-by-side.' },
  { icon: Activity, title: 'Solar position model', body: 'Calculated sun azimuth & elevation for any lat/lng/date drive the 3D sun direction and orientation factor in the model.' },
  { icon: LineChart, title: 'AI engineering report', body: 'Gemini/GPT-powered design-review memo, grounded in your numbers. Rule-based fallback if no API key is configured.' },
]

const STATS = [
  { value: '−15°C', label: 'Ladakh winter night modelled' },
  { value: '5R1C', label: 'Thermal model methodology' },
  { value: '24h', label: 'Hourly simulation resolution' },
  { value: '23', label: 'DRDO & Military material catalog' },
]

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="max-w-7xl mx-auto px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Snowflake className="text-ice" size={20} strokeWidth={2} />
          <div>
            <div className="font-display font-700 text-lg tracking-tight leading-none">MESH-THERMAL SHELTER</div>
            <div className="text-[9px] text-slate tracking-widest"></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/map" className="text-sm text-slate hover:text-frost transition-colors hidden md:block">Map Explorer</Link>
          <Link to="/dashboard" className="text-sm border border-line px-4 py-2 rounded-lg hover:border-ice/50 hover:text-ice2 transition-colors">
            Open Platform
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="rise">
            <div className="inline-flex items-center gap-2 text-[11px] text-ice2 bg-ice/10 border border-ice/20 px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-ice animate-pulse" />
             
            </div>
            <h1 className="font-display font-700 text-5xl lg:text-6xl leading-[1.05] mb-5">
              Shelter design for<br />
              <span className="text-ice">extreme climates</span>
            </h1>
            <p className="text-slate text-lg leading-relaxed mb-8 max-w-lg">
              Area-Specific Passive Shelter Thermal Design & Optimization Platform.
              Hourly conduction, solar irradiance, infiltration, and DRDO advanced materials.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/new-project"
                className="inline-flex items-center gap-2 bg-ice text-[#0A1018] font-semibold px-6 py-3 rounded-lg hover:bg-ice2 transition-colors shadow-lg shadow-ice/20">
                Start Designing <ArrowRight size={16} />
              </Link>
              <Link to="/map"
                className="inline-flex items-center gap-2 border border-line px-6 py-3 rounded-lg text-frost hover:border-ice/40 transition-colors">
                <MapIcon size={16} /> Explore Map
              </Link>
            </div>

            {/* Quick-access links */}
            <div className="mt-8 flex flex-wrap gap-2">
              {[
                { to: '/simulation', label: 'Run Simulation' },
                { to: '/comparison', label: 'Compare Designs' },
                { to: '/report', label: 'Generate Report' },
              ].map(({ to, label }) => (
                <Link key={to} to={to}
                  className="flex items-center gap-1 text-xs text-slate hover:text-ice2 transition-colors">
                  <ChevronRight size={12} />{label}
                </Link>
              ))}
            </div>
          </div>

          {/* Technical Engineering Overview Panel (No 3D Canvas on Landing) */}
          <div className="rounded-2xl border border-line p-6 bg-panel/80 backdrop-blur space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <div className="text-xs text-slate uppercase tracking-wider">Engineering Snapshot</div>
                <div className="font-display font-700 text-lg text-frost mt-0.5">High-Altitude Defense Habitat</div>
              </div>
              <span className="text-[10px] bg-ice/15 text-ice2 px-2.5 py-1 rounded-md font-mono border border-ice/30">
                
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-panel2 border border-line/60">
                <div className="flex items-center gap-1.5 text-xs text-slate mb-1">
                  <Thermometer size={14} className="text-ice" /> Outdoor Temp
                </div>
                <div className="text-xl font-data text-ice2">−14.8°C</div>
                <div className="text-[10px] text-slate mt-1">Siachen / Dras Sub-Zero</div>
              </div>

              <div className="p-3.5 rounded-lg bg-panel2 border border-line/60">
                <div className="flex items-center gap-1.5 text-xs text-slate mb-1">
                  <ShieldCheck size={14} className="text-emerald-400" /> Comfort Maintained
                </div>
                <div className="text-xl font-data text-emerald-400">+19.2°C</div>
                <div className="text-[10px] text-slate mt-1">Passive Solar + Aerogel</div>
              </div>

              <div className="p-3.5 rounded-lg bg-panel2 border border-line/60">
                <div className="flex items-center gap-1.5 text-xs text-slate mb-1">
                  <Mountain size={14} className="text-yellow-400" /> Site Altitude
                </div>
                <div className="text-xl font-data text-frost">3,500 m</div>
                <div className="text-[10px] text-slate mt-1">Density = 0.852 kg/m³</div>
              </div>

              <div className="p-3.5 rounded-lg bg-panel2 border border-line/60">
                <div className="flex items-center gap-1.5 text-xs text-slate mb-1">
                  <Cpu size={14} className="text-ember2" /> Peak Heat Loss
                </div>
                <div className="text-xl font-data text-ember2">1,840 W</div>
                <div className="text-[10px] text-slate mt-1">U = 0.18 W/m²K Assembly</div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-ice/20 bg-ice/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-frost font-medium">Aerogel & VIP Layer Optimization</span>
                <span className="text-ice font-mono">92% Passive Efficiency</span>
              </div>
              <div className="w-full h-1.5 bg-panel2 rounded-full overflow-hidden">
                <div className="h-full bg-ice rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="border border-line rounded-xl bg-panel/60 backdrop-blur px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <div className="data-num text-3xl text-ice2 font-semibold">{value}</div>
              <div className="text-xs text-slate mt-1.5 leading-snug">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Workflow strip ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="text-xs text-slate uppercase tracking-widest mb-6 text-center">How it works</div>
        <div className="flex flex-wrap justify-center gap-0">
          {[
            { n: '01', t: 'Pin location', d: 'Click the map to select a site. Climate data loads automatically.' },
            { n: '02', t: 'Configure shelter', d: 'Set dimensions, shape, orientation, materials, occupancy.' },
            { n: '03', t: 'Run simulation', d: '5R1C physics engine computes hourly heat balance, indoor temp.' },
            { n: '04', t: 'Analyse & export', d: 'AI-written engineering report. Export JSON, CSV, or print PDF.' },
          ].map(({ n, t, d }, i) => (
            <div key={n} className="flex items-start gap-3 w-full md:w-auto md:flex-1">
              <div className="flex items-start gap-3 flex-1 p-5 rounded-xl border border-line bg-panel/40 hover:border-ice/30 transition-colors">
                <div className="data-num text-3xl font-bold text-ice/30 shrink-0 leading-none">{n}</div>
                <div>
                  <div className="font-display font-600 text-sm mb-1">{t}</div>
                  <div className="text-xs text-slate leading-relaxed">{d}</div>
                </div>
              </div>
              {i < 3 && <div className="hidden md:flex items-center self-center text-slate/30 shrink-0"><ChevronRight size={18} /></div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature grid ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="text-xs text-slate uppercase tracking-widest mb-6 text-center">Platform capabilities</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title}
              className="border border-line rounded-xl p-5 bg-panel/40 hover:border-ice/25 hover:bg-panel/70 transition-all group">
              <div className="w-9 h-9 rounded-lg bg-ice/10 flex items-center justify-center mb-4 group-hover:bg-ice/20 transition-colors">
                <Icon size={18} className="text-ice" strokeWidth={1.75} />
              </div>
              <div className="font-display font-600 text-sm mb-2">{title}</div>
              <div className="text-xs text-slate leading-relaxed">{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="border border-ice/20 rounded-2xl bg-gradient-to-br from-ice/5 to-transparent p-10 text-center">
          <div className="font-display font-700 text-3xl mb-3">Ready to simulate?</div>
          <p className="text-slate mb-6 max-w-md mx-auto">
            Create a new project, select your site, and run the first simulation in under 3 minutes.
          </p>
          <Link to="/new-project"
            className="inline-flex items-center gap-2 bg-ice text-[#0A1018] font-semibold px-8 py-3.5 rounded-lg hover:bg-ice2 transition-colors shadow-lg shadow-ice/20">
            Create New Shelter Project <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-line text-xs text-slate flex flex-wrap justify-between gap-3">
        <span className="flex items-center gap-2"><Snowflake size={12} className="text-ice" /> MESH — Area-Specific Passive Shelter Thermal Design Platform</span>
        <span></span>
      </footer>
    </div>
  )
}
