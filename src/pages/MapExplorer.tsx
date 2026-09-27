/**
 * MapExplorer — Full-screen interactive site selection map with detailed
 * side panel showing climate data, elevation info, and thermal context.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, Thermometer, Wind, Droplets, Sun, Mountain,
  Gauge, Cloud, Compass, Loader2, ArrowRight, Globe,
  Activity,
} from 'lucide-react'
import LocationMap from '../components/LocationMap'
import { getClimate, getElevation } from '../lib/climate'
import { LADAKH_DEMO_CLIMATE, LADAKH_LOCATION } from '../data/ladakhDemo'
import { useProject } from '../store/ProjectContext'
import type { ClimateSnapshot, Location } from '../types'

// Altitude-based atmospheric pressure (ISA formula)
function calcPressure(alt: number) {
  return 101325 * Math.pow(1 - (0.0065 * alt) / 288.15, 5.2561)
}
function calcDensity(pressurePa: number, tempC: number) {
  return pressurePa / (287.05 * (tempC + 273.15))
}

function windDirLabel(deg: number) {
  return ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.round(deg / 22.5) % 16]
}

function kompassRose(deg: number) {
  return (
    <div className="relative w-12 h-12 shrink-0">
      <div className="absolute inset-0 rounded-full border border-line flex items-center justify-center">
        <Compass size={28} className="text-slate" style={{ transform: `rotate(${deg}deg)`, color: '#4FD1E8' }} />
      </div>
    </div>
  )
}

interface Stat {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  highlight?: boolean
}

function StatRow({ icon, label, value, sub, highlight }: Stat) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border
      ${highlight ? 'border-ice/20 bg-ice/5' : 'border-line bg-panel2/50'}`}>
      <div className="shrink-0 text-slate">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate">{label}</div>
        <div className={`text-sm font-data font-medium ${highlight ? 'text-ice' : 'text-frost'}`}>{value}</div>
        {sub && <div className="text-[11px] text-slate">{sub}</div>}
      </div>
    </div>
  )
}

export default function MapExplorer() {
  const { project, setProject } = useProject()
  const navigate = useNavigate()
  const [lat, setLat] = useState(project.location.lat)
  const [lng, setLng] = useState(project.location.lng)
  const [altitude, setAltitude] = useState(project.location.altitudeM)
  const [climate, setClimate] = useState<ClimateSnapshot>(project.climate)
  const [locName, setLocName] = useState(project.location.name)
  const [locRegion, setLocRegion] = useState(project.location.region ?? '')
  const [locCountry, setLocCountry] = useState(project.location.country ?? '')
  const [loading, setLoading] = useState(false)

  async function handlePick(pickLat: number, pickLng: number) {
    setLat(pickLat)
    setLng(pickLng)
    setLoading(true)
    const [snap, elev] = await Promise.all([
      getClimate(pickLat, pickLng),
      getElevation(pickLat, pickLng),
    ])
    setClimate(snap)
    if (elev !== null) setAltitude(elev)
    setLoading(false)
  }

  function handleLocationResolved(loc: Partial<Location> & { name: string }) {
    setLocName(loc.name)
    setLocRegion(loc.region ?? '')
    setLocCountry(loc.country ?? '')
  }

  function applyToProject() {
    setProject((p) => ({
      ...p,
      location: {
        ...p.location,
        lat, lng,
        altitudeM: altitude,
        name: locName,
        region: locRegion,
        country: locCountry,
      },
      climate,
    }))
    navigate('/new-project')
  }

  function loadDemo() {
    setLat(LADAKH_LOCATION.lat)
    setLng(LADAKH_LOCATION.lng)
    setAltitude(LADAKH_LOCATION.altitudeM)
    setClimate(LADAKH_DEMO_CLIMATE)
    setLocName(LADAKH_LOCATION.name)
    setLocRegion(LADAKH_LOCATION.region)
    setLocCountry(LADAKH_LOCATION.country)
  }

  const pressurePa = calcPressure(altitude)
  const pressureHpa = pressurePa / 100
  const density = calcDensity(pressurePa, climate.tempC)
  const dewPointC = climate.tempC - ((100 - climate.humidityPct) / 5)

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* ── Map (left, takes most space) ─────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <LocationMap
          lat={lat}
          lng={lng}
          altitudeM={altitude}
          climate={climate}
          locationName={locName}
          onPick={handlePick}
          onLocationResolved={handleLocationResolved}
          height={window.innerHeight - 0}
          showClimatePanel
        />
      </div>

      {/* ── Side panel (right) ────────────────────────────────────────────── */}
      <aside className="w-[320px] shrink-0 border-l border-line bg-panel2/80 backdrop-blur
                        flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="px-5 py-4 border-b border-line">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <MapPin size={14} className="text-ice" />
                {loading
                  ? <span className="text-sm text-slate flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin" /> Fetching…
                    </span>
                  : <span className="text-sm font-medium text-frost truncate max-w-[200px]">
                      {locName || 'Select a location'}
                    </span>
                }
              </div>
              {locRegion && (
                <div className="text-xs text-slate flex items-center gap-1 ml-[22px]">
                  <Globe size={11} />
                  {[locRegion, locCountry].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
            <span className={`text-[10px] px-2 py-1 rounded font-medium shrink-0 mt-0.5
              ${climate.source === 'live' ? 'bg-ice/15 text-ice2' : 'bg-ember/15 text-ember2'}`}>
              {climate.source === 'live' ? 'LIVE' : 'DEMO'}
            </span>
          </div>
        </div>

        {/* Coordinates */}
        <div className="px-5 py-3 border-b border-line grid grid-cols-3 gap-2">
          <div>
            <div className="text-[10px] text-slate mb-0.5">Latitude</div>
            <div className="text-xs font-data text-frost">{lat.toFixed(5)}°</div>
          </div>
          <div>
            <div className="text-[10px] text-slate mb-0.5">Longitude</div>
            <div className="text-xs font-data text-frost">{lng.toFixed(5)}°</div>
          </div>
          <div>
            <div className="text-[10px] text-slate mb-0.5">Altitude</div>
            <div className="text-xs font-data text-ice">{altitude.toFixed(0)} m</div>
          </div>
        </div>

        {/* Climate stats */}
        <div className="px-4 py-3 space-y-2">
          <div className="text-xs text-slate font-medium uppercase tracking-wider mb-1 px-1">
            Current Conditions
          </div>

          <StatRow
            icon={<Thermometer size={15} />}
            label="Air Temperature"
            value={`${climate.tempC.toFixed(1)}°C`}
            sub={`Dew point: ${dewPointC.toFixed(1)}°C`}
            highlight={climate.tempC < 0}
          />
          <StatRow
            icon={<Wind size={15} />}
            label="Wind"
            value={`${climate.windSpeedMs.toFixed(1)} m/s`}
            sub={`${windDirLabel(climate.windDirDeg ?? 0)} · ${(climate.windSpeedMs * 3.6).toFixed(0)} km/h`}
          />
          <StatRow
            icon={<Sun size={15} />}
            label="Solar Irradiance"
            value={`${climate.solarWm2.toFixed(0)} W/m²`}
            sub="Global horizontal"
          />
          <StatRow
            icon={<Droplets size={15} />}
            label="Humidity"
            value={`${climate.humidityPct.toFixed(0)}%`}
            sub="Relative"
          />
          <StatRow
            icon={<Cloud size={15} />}
            label="Cloud Cover"
            value={`${climate.cloudCoverPct.toFixed(0)}%`}
          />
          {climate.precipMm > 0 && (
            <StatRow
              icon={<Droplets size={15} className="text-blue-400" />}
              label="Precipitation"
              value={`${climate.precipMm.toFixed(1)} mm`}
            />
          )}
        </div>

        {/* Atmospheric properties */}
        <div className="px-4 py-3 space-y-2 border-t border-line">
          <div className="text-xs text-slate font-medium uppercase tracking-wider mb-1 px-1">
            Atmospheric Properties
          </div>
          <StatRow
            icon={<Mountain size={15} />}
            label="Altitude"
            value={`${altitude.toFixed(0)} m asl`}
            sub={`${(altitude * 3.28084).toFixed(0)} ft`}
          />
          <StatRow
            icon={<Gauge size={15} />}
            label="Atmospheric Pressure"
            value={`${pressureHpa.toFixed(1)} hPa`}
            sub={`${(pressureHpa * 0.750062).toFixed(1)} mmHg`}
          />
          <StatRow
            icon={<Activity size={15} />}
            label="Air Density"
            value={`${density.toFixed(3)} kg/m³`}
            sub={`Std. sea-level: 1.225 kg/m³`}
            highlight
          />
        </div>

        {/* Wind compass */}
        <div className="px-5 py-3 border-t border-line">
          <div className="text-xs text-slate font-medium uppercase tracking-wider mb-2">Wind Direction</div>
          <div className="flex items-center gap-3">
            {kompassRose(climate.windDirDeg ?? 0)}
            <div>
              <div className="text-sm font-data text-frost">{(climate.windDirDeg ?? 0).toFixed(0)}°</div>
              <div className="text-xs text-slate">{windDirLabel(climate.windDirDeg ?? 0)}</div>
            </div>
          </div>
        </div>

        {/* Thermal context */}
        <div className="px-4 py-3 border-t border-line">
          <div className="text-xs text-slate font-medium uppercase tracking-wider mb-2 px-1">
            Thermal Context
          </div>
          <div className="space-y-2 text-xs text-slate">
            {climate.tempC < -10 && (
              <div className="flex items-start gap-2 p-2.5 rounded-md border border-ice/20 bg-ice/5">
                <span className="text-ice font-medium shrink-0">⚠</span>
                <span>Extreme cold region. Insulation and thermal mass are critical design factors.</span>
              </div>
            )}
            {climate.solarWm2 > 600 && (
              <div className="flex items-start gap-2 p-2.5 rounded-md border border-yellow-400/20 bg-yellow-400/5">
                <span className="text-yellow-400 font-medium shrink-0">☀</span>
                <span>High solar irradiance. South-facing windows can provide significant passive gain.</span>
              </div>
            )}
            {altitude > 2500 && (
              <div className="flex items-start gap-2 p-2.5 rounded-md border border-ember/20 bg-ember/5">
                <span className="text-ember font-medium shrink-0">▲</span>
                <span>High altitude: air density {((density / 1.225) * 100).toFixed(0)}% of sea level. Ventilation calculations must be corrected.</span>
              </div>
            )}
            {climate.windSpeedMs > 5 && (
              <div className="flex items-start gap-2 p-2.5 rounded-md border border-slate/30 bg-panel">
                <span className="text-slate font-medium shrink-0">~</span>
                <span>High wind: infiltration and convective losses will be elevated. Airtight envelope recommended.</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-4 mt-auto border-t border-line space-y-2">
          <button
            onClick={applyToProject}
            className="w-full flex items-center justify-center gap-2 bg-ice text-base
                       py-2.5 rounded-lg text-sm font-medium hover:bg-ice2 transition-colors"
          >
            Use This Location
            <ArrowRight size={15} />
          </button>
          <button
            onClick={loadDemo}
            className="w-full py-2 rounded-lg text-xs text-slate border border-line
                       hover:border-ice/40 hover:text-frost transition-colors"
          >
            Load Demo: Leh, Ladakh
          </button>
        </div>
      </aside>
    </div>
  )
}
