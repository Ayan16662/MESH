import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProject } from '../store/ProjectContext'
import { MATERIALS } from '../data/materials'
import { getClimate, getElevation } from '../lib/climate'
import { LADAKH_DEMO_CLIMATE, LADAKH_LOCATION } from '../data/ladakhDemo'
import LocationMap from '../components/LocationMap'
import { Loader2, MapPin } from 'lucide-react'
import type { Location } from '../types'

const STEPS = ['Project Info', 'Location & Climate', 'Geometry', 'Materials', 'Occupancy & Ventilation']

export default function NewProject() {
  const { project, setProject, save } = useProject()
  const [step, setStep] = useState(0)
  const [loadingClimate, setLoadingClimate] = useState(false)
  const nav = useNavigate()

  async function pickLocation(lat: number, lng: number) {
    setLoadingClimate(true)
    const [climate, altitude] = await Promise.all([getClimate(lat, lng), getElevation(lat, lng)])
    setProject((p) => ({
      ...p,
      location: { ...p.location, lat, lng, altitudeM: altitude ?? p.location.altitudeM },
      climate,
    }))
    setLoadingClimate(false)
  }

  function handleLocationResolved(loc: Partial<Location> & { name: string }) {
    setProject((p) => ({
      ...p,
      location: {
        ...p.location,
        name: loc.name,
        region: loc.region ?? p.location.region,
        country: loc.country ?? p.location.country,
      },
    }))
  }

  function loadDemo() {
    setProject((p) => ({ ...p, location: { ...LADAKH_LOCATION }, climate: { ...LADAKH_DEMO_CLIMATE } }))
  }

  function finish() {
    save()
    nav('/designer')
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-display font-700 text-2xl mb-1">New Shelter Project</h1>
      <p className="text-sm text-slate mb-6">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>

      <div className="flex gap-1.5 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-ice' : 'bg-line'}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <Field label="Project Name">
            <input className="input" value={project.name} onChange={(e) => setProject((p) => ({ ...p, name: e.target.value }))} />
          </Field>
          <Field label="Description">
            <textarea className="input" rows={3} value={project.description} onChange={(e) => setProject((p) => ({ ...p, description: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Designer">
              <input className="input" value={project.designer} onChange={(e) => setProject((p) => ({ ...p, designer: e.target.value }))} />
            </Field>
            <Field label="Organization">
              <input className="input" value={project.organization} onChange={(e) => setProject((p) => ({ ...p, organization: e.target.value }))} />
            </Field>
          </div>
          <Field label="Shelter Type">
            <select className="input" value={project.shelterType} onChange={(e) => setProject((p) => ({ ...p, shelterType: e.target.value }))}>
              {['Personnel Shelter', 'Field Station', 'Storage Shelter', 'Medical Post', 'Observation Post'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate flex items-center gap-1.5"><MapPin size={14} /> Click the map to set the site location</div>
            <button onClick={loadDemo} className="text-xs border border-line px-3 py-1.5 rounded-md hover:border-ice/40 text-slate">Load Demo Dataset (Leh, Ladakh)</button>
          </div>
          <LocationMap
            lat={project.location.lat}
            lng={project.location.lng}
            altitudeM={project.location.altitudeM}
            climate={project.climate}
            locationName={project.location.name}
            onPick={pickLocation}
            onLocationResolved={handleLocationResolved}
            height={420}
          />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Latitude"><div className="input data-num">{project.location.lat.toFixed(4)}</div></Field>
            <Field label="Longitude"><div className="input data-num">{project.location.lng.toFixed(4)}</div></Field>
            <Field label="Altitude (m)">
              <input type="number" className="input data-num" value={project.location.altitudeM}
                onChange={(e) => setProject((p) => ({ ...p, location: { ...p.location, altitudeM: Number(e.target.value) } }))} />
            </Field>
          </div>
          {/* Location name (auto-filled by reverse geocode) */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Location Name">
              <div className="input text-sm flex items-center gap-2">
                {loadingClimate && <Loader2 size={12} className="animate-spin text-slate" />}
                <span className="truncate">{project.location.name || '—'}</span>
              </div>
            </Field>
            <Field label="Region">
              <div className="input text-sm">{project.location.region || '—'}</div>
            </Field>
            <Field label="Country">
              <div className="input text-sm">{project.location.country || '—'}</div>
            </Field>
          </div>
          <div className="border border-line rounded-md p-4 bg-panel">
            <div className="text-xs text-slate mb-2 flex items-center gap-2">
              Climate Summary
              {loadingClimate && <Loader2 size={12} className="animate-spin" />}
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${project.climate.source === 'live' ? 'bg-ice/15 text-ice2' : 'bg-ember/15 text-ember2'}`}>
                {project.climate.source === 'live' ? 'LIVE DATA' : 'DEMO DATA'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3 data-num text-sm">
              <div><span className="text-slate text-xs block">Temp</span>{project.climate.tempC.toFixed(1)}°C</div>
              <div><span className="text-slate text-xs block">Humidity</span>{project.climate.humidityPct.toFixed(0)}%</div>
              <div><span className="text-slate text-xs block">Wind</span>{project.climate.windSpeedMs.toFixed(1)} m/s</div>
              <div><span className="text-slate text-xs block">Solar</span>{project.climate.solarWm2.toFixed(0)} W/m²</div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Length (m)"><NumInput v={project.geometry.lengthM} on={(v) => setProject((p) => ({ ...p, geometry: { ...p.geometry, lengthM: v } }))} /></Field>
          <Field label="Width (m)"><NumInput v={project.geometry.widthM} on={(v) => setProject((p) => ({ ...p, geometry: { ...p.geometry, widthM: v } }))} /></Field>
          <Field label="Height (m)"><NumInput v={project.geometry.heightM} on={(v) => setProject((p) => ({ ...p, geometry: { ...p.geometry, heightM: v } }))} /></Field>
          <Field label="Roof Height (m)"><NumInput v={project.geometry.roofHeightM} on={(v) => setProject((p) => ({ ...p, geometry: { ...p.geometry, roofHeightM: v } }))} /></Field>
          <Field label="Wall Thickness (m)"><NumInput v={project.geometry.wallThicknessM} step={0.01} on={(v) => setProject((p) => ({ ...p, geometry: { ...p.geometry, wallThicknessM: v } }))} /></Field>
          <Field label="Shape">
            <select className="input" value={project.geometry.shape} onChange={(e) => setProject((p) => ({ ...p, geometry: { ...p.geometry, shape: e.target.value as any } }))}>
              {['rectangular', 'square', 'a-frame', 'dome'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Orientation">
            <select className="input" value={String(project.geometry.orientation)} onChange={(e) => setProject((p) => ({ ...p, geometry: { ...p.geometry, orientation: e.target.value as any } }))}>
              {['N', 'S', 'E', 'W'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Window Area (m² total)"><NumInput v={project.geometry.windowAreaM2} step={0.1} on={(v) => setProject((p) => ({ ...p, geometry: { ...p.geometry, windowAreaM2: v } }))} /></Field>
          <Field label="Number of Windows"><NumInput v={project.geometry.numWindows} step={1} on={(v) => setProject((p) => ({ ...p, geometry: { ...p.geometry, numWindows: Math.round(v) } }))} /></Field>
          <Field label="Door Area (m² total)"><NumInput v={project.geometry.doorAreaM2} step={0.1} on={(v) => setProject((p) => ({ ...p, geometry: { ...p.geometry, doorAreaM2: v } }))} /></Field>
          <Field label="Number of Doors"><NumInput v={project.geometry.numDoors} step={1} on={(v) => setProject((p) => ({ ...p, geometry: { ...p.geometry, numDoors: Math.round(v) } }))} /></Field>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <AssemblyEditor
            title="Wall Assembly"
            assembly={project.wallAssembly}
            onChange={(a) => setProject((p) => ({ ...p, wallAssembly: a }))}
          />
          <AssemblyEditor
            title="Roof Assembly"
            assembly={project.roofAssembly}
            onChange={(a) => setProject((p) => ({ ...p, roofAssembly: a }))}
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Number of Occupants"><NumInput v={project.occupancy.numOccupants} step={1} on={(v) => setProject((p) => ({ ...p, occupancy: { ...p.occupancy, numOccupants: Math.round(v) } }))} /></Field>
            <Field label="Activity Level">
              <select className="input" value={project.occupancy.activityLevel} onChange={(e) => setProject((p) => ({ ...p, occupancy: { ...p.occupancy, activityLevel: e.target.value as any } }))}>
                {['resting', 'light', 'moderate', 'heavy'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Schedule Start"><input type="time" className="input" value={project.occupancy.scheduleStart} onChange={(e) => setProject((p) => ({ ...p, occupancy: { ...p.occupancy, scheduleStart: e.target.value } }))} /></Field>
            <Field label="Schedule End"><input type="time" className="input" value={project.occupancy.scheduleEnd} onChange={(e) => setProject((p) => ({ ...p, occupancy: { ...p.occupancy, scheduleEnd: e.target.value } }))} /></Field>
            <Field label="Sensible Heat / Person (W)"><NumInput v={project.occupancy.sensibleHeatPerPersonW} on={(v) => setProject((p) => ({ ...p, occupancy: { ...p.occupancy, sensibleHeatPerPersonW: v } }))} /></Field>
            <Field label="Latent Heat / Person (W)"><NumInput v={project.occupancy.latentHeatPerPersonW} on={(v) => setProject((p) => ({ ...p, occupancy: { ...p.occupancy, latentHeatPerPersonW: v } }))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Natural Ventilation (ACH)"><NumInput v={project.ventilation.ach} step={0.1} on={(v) => setProject((p) => ({ ...p, ventilation: { ...p.ventilation, ach: v } }))} /></Field>
            <Field label="Mechanical Ventilation (ACH)"><NumInput v={project.ventilation.mechanicalAch} step={0.1} on={(v) => setProject((p) => ({ ...p, ventilation: { ...p.ventilation, mechanicalAch: v } }))} /></Field>
            <Field label="Window Open Fraction (0–1)"><NumInput v={project.ventilation.windowOpenFraction} step={0.05} on={(v) => setProject((p) => ({ ...p, ventilation: { ...p.ventilation, windowOpenFraction: v } }))} /></Field>
            <Field label="Base Infiltration (ACH)"><NumInput v={project.ventilation.infiltrationAchBase} step={0.05} on={(v) => setProject((p) => ({ ...p, ventilation: { ...p.ventilation, infiltrationAchBase: v } }))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Comfort Min (°C)"><NumInput v={project.comfort.minC} on={(v) => setProject((p) => ({ ...p, comfort: { ...p.comfort, minC: v } }))} /></Field>
            <Field label="Comfort Max (°C)"><NumInput v={project.comfort.maxC} on={(v) => setProject((p) => ({ ...p, comfort: { ...p.comfort, maxC: v } }))} /></Field>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="px-4 py-2 text-sm border border-line rounded-md disabled:opacity-30 hover:border-ice/40">
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep((s) => s + 1)} className="px-4 py-2 text-sm bg-ice text-base rounded-md hover:bg-ice2">
            Continue
          </button>
        ) : (
          <button onClick={finish} className="px-4 py-2 text-sm bg-ice text-base rounded-md hover:bg-ice2">
            Save & Open Designer
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-slate mb-1.5">{label}</div>
      {children}
    </label>
  )
}

function NumInput({ v, on, step = 1 }: { v: number; on: (n: number) => void; step?: number }) {
  return <input type="number" step={step} className="input data-num" value={v} onChange={(e) => on(Number(e.target.value))} />
}

function AssemblyEditor({ title, assembly, onChange }: { title: string; assembly: any; onChange: (a: any) => void }) {
  function updateLayer(i: number, field: string, value: any) {
    const layers = assembly.layers.map((l: any, idx: number) => (idx === i ? { ...l, [field]: value } : l))
    onChange({ ...assembly, layers })
  }
  function addLayer() {
    onChange({ ...assembly, layers: [...assembly.layers, { materialId: 'aerogel', thicknessM: 0.05 }] })
  }
  function removeLayer(i: number) {
    onChange({ ...assembly, layers: assembly.layers.filter((_: any, idx: number) => idx !== i) })
  }

  const drdoMaterials = MATERIALS.filter((m) => m.category === 'drdo_military')
  const pcmMaterials = MATERIALS.filter((m) => m.category === 'pcm')
  const insulationMaterials = MATERIALS.filter((m) => m.category === 'insulation')
  const radiantMaterials = MATERIALS.filter((m) => m.category === 'radiant')
  const standardMaterials = MATERIALS.filter((m) => !m.category || m.category === 'standard')

  return (
    <div className="border border-line rounded-md p-4 bg-panel">
      <div className="font-display font-600 text-sm mb-3">{title} <span className="text-slate font-normal">(outside → inside)</span></div>
      <div className="space-y-3">
        {assembly.layers.map((l: any, i: number) => {
          const selectedMat = MATERIALS.find((m) => m.id === l.materialId)
          return (
            <div key={i} className="border border-line/60 rounded p-2.5 bg-panel2 space-y-2">
              <div className="flex items-center gap-2">
                <select className="input flex-1 font-sans text-xs" value={l.materialId} onChange={(e) => updateLayer(i, 'materialId', e.target.value)}>
                  <optgroup label="🎖️ DRDO & Military Grade Advanced Materials">
                    {drdoMaterials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </optgroup>
                  <optgroup label="🔋 PCM Thermal Energy Storage">
                    {pcmMaterials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </optgroup>
                  <optgroup label="🛡️ Radiant & Radiation Barriers">
                    {radiantMaterials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </optgroup>
                  <optgroup label="❄️ Thermal Insulation">
                    {insulationMaterials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </optgroup>
                  <optgroup label="🧱 Standard Structural Materials">
                    {standardMaterials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </optgroup>
                </select>
                <input type="number" step={0.005} className="input w-24 data-num text-xs" value={l.thicknessM} onChange={(e) => updateLayer(i, 'thicknessM', Number(e.target.value))} />
                <span className="text-xs text-slate w-6">m</span>
                <button onClick={() => removeLayer(i)} className="text-xs text-ember2 px-2 hover:text-red-400">✕</button>
              </div>

              {selectedMat && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate px-1">
                  <span>k = <strong className="text-frost font-mono">{selectedMat.thermalConductivityWmK} W/m·K</strong></span>
                  <span>Density = <strong className="text-slate-200 font-mono">{selectedMat.densityKgM3} kg/m³</strong></span>
                  <span>R-value = <strong className="text-emerald-400 font-mono">{(l.thicknessM / selectedMat.thermalConductivityWmK).toFixed(3)} m²K/W</strong></span>
                  {selectedMat.description && <span className="text-slate/70 italic text-[10px] w-full mt-0.5">{selectedMat.description}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <button onClick={addLayer} className="mt-3 text-xs border border-line px-3 py-1.5 rounded-md hover:border-ice/40 text-slate">+ Add Layer</button>
    </div>
  )
}

