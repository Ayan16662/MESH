import { useState } from 'react'
import { useProject } from '../store/ProjectContext'
import Shelter2D from '../components/Shelter2D'
import Shelter3D from '../components/Shelter3D'
import { uValue, assemblyResistance, envelopeAreas } from '../lib/physics'
import { sunPosition } from '../lib/solar'

export default function Designer() {
  const { project, setProject, save } = useProject()
  const [showVent, setShowVent] = useState(false)
  const [showOcc, setShowOcc] = useState(false)

  const uWall = uValue(project.wallAssembly)
  const rWall = assemblyResistance(project.wallAssembly)
  const uRoof = uValue(project.roofAssembly)
  const areas = envelopeAreas(project.geometry)

  const sun = sunPosition(project.location.lat, project.location.lng, new Date(project.simulationSettings.date), 12)

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-700 text-2xl">2D / 3D Shelter Designer</h1>
          <p className="text-sm text-slate mt-1">{project.name} · {project.location.name}</p>
        </div>
        <button onClick={save} className="text-sm border border-line px-4 py-2 rounded-md hover:border-ice/40">Save Project</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Shelter3D
            geometry={project.geometry}
            view="solid"
            showVentilation={showVent}
            showOccupancy={showOcc}
            occupants={project.occupancy.numOccupants}
            sunAzimuthDeg={sun.azimuthDeg}
            sunElevationDeg={sun.elevationDeg}
            locationName={project.location.name}
            altitudeM={project.location.altitudeM}
            tempC={project.climate.tempC}
            currentResult={project.results}
          />
          <div className="flex gap-4 text-xs text-slate px-1">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={showVent} onChange={(e) => setShowVent(e.target.checked)} /> Ventilation overlay</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={showOcc} onChange={(e) => setShowOcc(e.target.checked)} /> Occupancy overlay</label>
            <span className="data-num">Sun: elev {sun.elevationDeg.toFixed(0)}° / az {sun.azimuthDeg.toFixed(0)}°</span>
          </div>
          <Shelter2D geometry={project.geometry} />
        </div>

        <div className="space-y-4">
          <Panel title="Envelope Summary">
            <Row label="Wall U-value" value={`${uWall.toFixed(3)} W/m²K`} />
            <Row label="Wall R-value" value={`${rWall.toFixed(2)} m²K/W`} />
            <Row label="Roof U-value" value={`${uRoof.toFixed(3)} W/m²K`} />
            <Row label="Net wall area" value={`${areas.netWallArea.toFixed(1)} m²`} />
            <Row label="Roof area" value={`${areas.roofArea.toFixed(1)} m²`} />
            <Row label="Floor area" value={`${areas.floorArea.toFixed(1)} m²`} />
            <Row label="Volume" value={`${areas.volume.toFixed(1)} m³`} />
          </Panel>

          <Panel title="Quick Geometry Edit">
            <QuickNum label="Length (m)" v={project.geometry.lengthM} on={(v) => setProject((p) => ({ ...p, geometry: { ...p.geometry, lengthM: v } }))} />
            <QuickNum label="Width (m)" v={project.geometry.widthM} on={(v) => setProject((p) => ({ ...p, geometry: { ...p.geometry, widthM: v } }))} />
            <QuickNum label="Height (m)" v={project.geometry.heightM} on={(v) => setProject((p) => ({ ...p, geometry: { ...p.geometry, heightM: v } }))} />
            <QuickNum label="Wall thickness (m)" v={project.geometry.wallThicknessM} step={0.01} on={(v) => setProject((p) => ({ ...p, geometry: { ...p.geometry, wallThicknessM: v } }))} />
          </Panel>

          <Panel title="Location & Climate">
            <Row label="Location" value={project.location.name} />
            <Row label="Altitude" value={`${project.location.altitudeM.toFixed(0)} m`} />
            <Row label="Outdoor temp" value={`${project.climate.tempC.toFixed(1)} °C`} />
            <Row label="Data source" value={project.climate.source === 'live' ? 'Live API' : 'Demo dataset'} />
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-line rounded-md bg-panel p-4">
      <div className="font-display font-600 text-sm mb-3">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate">{label}</span>
      <span className="data-num text-frost">{value}</span>
    </div>
  )
}

function QuickNum({ label, v, on, step = 0.1 }: { label: string; v: number; on: (n: number) => void; step?: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate">{label}</span>
      <input type="number" step={step} value={v} onChange={(e) => on(Number(e.target.value))} className="input data-num w-24 py-1" />
    </div>
  )
}
