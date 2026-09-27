import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProject } from '../store/ProjectContext'
import { runSimulation } from '../lib/physics'
import Shelter3D from '../components/Shelter3D'
import { Play, RotateCcw } from 'lucide-react'

export default function Simulation() {
  const { project, setProject, save } = useProject()
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewIdx, setPreviewIdx] = useState<number | null>(null)
  const nav = useNavigate()

  async function run() {
    setRunning(true)
    setProgress(0)
    const settings = project.simulationSettings
    const totalHours = settings.endHour - settings.startHour + 1

    // Simulate progressively so the UI shows real incremental state, computed
    // by re-running the engine on growing hour windows (cheap for 24h scale).
    for (let step = 1; step <= totalHours; step++) {
      const partial = runSimulation({
        geometry: project.geometry,
        wallAssembly: project.wallAssembly,
        roofAssembly: project.roofAssembly,
        occupancy: project.occupancy,
        ventilation: project.ventilation,
        climate: project.climate,
        location: project.location,
        comfort: project.comfort,
        settings: { ...settings, endHour: settings.startHour + step - 1 },
      })
      setPreviewIdx(partial.hourly.length - 1)
      setProgress(Math.round((step / totalHours) * 100))
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 35))
      if (step === totalHours) {
        setProject((p) => ({ ...p, results: partial }))
      }
    }
    setRunning(false)
  }

  function reset() {
    setProject((p) => ({ ...p, results: undefined }))
    setProgress(0)
    setPreviewIdx(null)
  }

  const previewResult = project.results?.hourly[previewIdx ?? project.results.hourly.length - 1]

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="font-display font-700 text-2xl mb-1">Thermal Simulation</h1>
      <p className="text-sm text-slate mb-6">{project.name} · hourly 5R1C-style physics engine</p>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <Shelter3D
            geometry={project.geometry}
            view="thermal"
            showVentilation={project.ventilation.ach > 0}
            showOccupancy={project.occupancy.numOccupants > 0}
            occupants={project.occupancy.numOccupants}
            currentResult={previewResult}
          />
          {previewResult && (
            <div className="grid grid-cols-4 gap-3">
              <MiniStat label="Hour" value={previewResult.hour} />
              <MiniStat label="Indoor" value={`${previewResult.indoorTempC.toFixed(1)}°C`} accent="ice" />
              <MiniStat label="Outdoor" value={`${previewResult.outdoorTempC.toFixed(1)}°C`} />
              <MiniStat label="Net Flow" value={`${previewResult.netHeatFlowW.toFixed(0)} W`} accent={previewResult.netHeatFlowW < 0 ? 'ember' : 'ice'} />
            </div>
          )}
        </div>

        <div className="border border-line rounded-md bg-panel p-4 h-fit space-y-4">
          <div className="font-display font-600 text-sm">Simulation Settings</div>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Date">
              <input type="date" className="input" value={project.simulationSettings.date}
                onChange={(e) => setProject((p) => ({ ...p, simulationSettings: { ...p.simulationSettings, date: e.target.value } }))} />
            </Labeled>
            <Labeled label="Time Step">
              <select className="input" value={project.simulationSettings.timeStepMin}
                onChange={(e) => setProject((p) => ({ ...p, simulationSettings: { ...p.simulationSettings, timeStepMin: Number(e.target.value) } }))}>
                <option value={60}>60 min</option>
              </select>
            </Labeled>
            <Labeled label="Start Hour">
              <input type="number" min={0} max={23} className="input data-num" value={project.simulationSettings.startHour}
                onChange={(e) => setProject((p) => ({ ...p, simulationSettings: { ...p.simulationSettings, startHour: Number(e.target.value) } }))} />
            </Labeled>
            <Labeled label="End Hour">
              <input type="number" min={0} max={23} className="input data-num" value={project.simulationSettings.endHour}
                onChange={(e) => setProject((p) => ({ ...p, simulationSettings: { ...p.simulationSettings, endHour: Number(e.target.value) } }))} />
            </Labeled>
          </div>

          <div className="flex gap-2">
            <button onClick={run} disabled={running} className="flex-1 flex items-center justify-center gap-1.5 bg-ice text-base text-sm font-medium py-2 rounded-md hover:bg-ice2 disabled:opacity-50">
              <Play size={14} /> {running ? 'Running…' : 'Run Simulation'}
            </button>
            <button onClick={reset} className="px-3 py-2 border border-line rounded-md hover:border-ice/40">
              <RotateCcw size={14} />
            </button>
          </div>

          {(running || progress > 0) && (
            <div>
              <div className="h-1.5 bg-panel2 rounded-full overflow-hidden">
                <div className="h-full bg-ice transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-xs text-slate mt-1 data-num">{progress}%</div>
            </div>
          )}

          {project.results && !running && (
            <button onClick={() => { save(); nav('/results') }} className="w-full text-sm border border-ice/40 text-ice2 py-2 rounded-md hover:bg-ice/10">
              View Full Results →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] text-slate mb-1">{label}</div>
      {children}
    </label>
  )
}

function MiniStat({ label, value, accent = 'frost' }: { label: string; value: string | number; accent?: 'ice' | 'ember' | 'frost' }) {
  const cls = { ice: 'text-ice2', ember: 'text-ember2', frost: 'text-frost' }[accent]
  return (
    <div className="border border-line rounded-md bg-panel px-3 py-2">
      <div className="text-[10px] text-slate uppercase">{label}</div>
      <div className={`data-num text-lg ${cls}`}>{value}</div>
    </div>
  )
}
