import { useMemo, useRef, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Geometry, HourlyResult, SimulationResults } from '../types'
import { searchLocation, getClimate, getElevation } from '../lib/climate'
import { useProject } from '../store/ProjectContext'
import { useNavigate } from 'react-router-dom'
import {
  Paperclip, Layers, Sun, Snowflake, Compass, Mountain,
  FileText, Sparkles, Play, Box as BoxIcon, MapPin, Search, X, Loader2,
  CheckCircle2, AlertTriangle, Shield, Thermometer,
} from 'lucide-react'

interface Props {
  geometry: Geometry
  view?: 'solid' | 'thermal' | 'solar' | 'wireframe' | 'cad'
  showVentilation?: boolean
  showOccupancy?: boolean
  occupants?: number
  currentResult?: SimulationResults | HourlyResult
  sunAzimuthDeg?: number
  sunElevationDeg?: number
  locationName?: string
  altitudeM?: number
  tempC?: number
  onRunSimulation?: () => void
}

// Thermal Isotherm Color Mapping
function tempToColor(t: number): THREE.Color {
  const clamped = Math.max(-25, Math.min(35, t))
  const frac = (clamped + 25) / 60
  const cold = new THREE.Color('#38BDF8')  // Ice Blue
  const mid = new THREE.Color('#10B981')   // Optimal Green
  const hot = new THREE.Color('#EF4444')   // Heat Warning
  if (frac < 0.5) {
    return cold.clone().lerp(mid, frac * 2)
  }
  return mid.clone().lerp(hot, (frac - 0.5) * 2)
}

// Procedural Vibrant Terracotta Masonry Wall Texture
function useVibrantWallTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.fillStyle = '#9A3412' // Terracotta Base
    ctx.fillRect(0, 0, 512, 512)

    const rows = 16
    const cols = 8
    const h = 512 / rows
    const w = 512 / cols

    ctx.fillStyle = '#C2410C' // Bright Warm Terracotta
    ctx.strokeStyle = '#7C2D12' // Mortar Lines
    ctx.lineWidth = 4

    for (let r = 0; r < rows; r++) {
      const shift = (r % 2) * (w / 2)
      for (let c = -1; c <= cols; c++) {
        const x = c * w + shift
        const y = r * h
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4)
        ctx.strokeRect(x, y, w, h)
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(3, 2)
    return texture
  }, [])
}

// Celestial Sun Orbit Arc & Solar Station Gizmo
function DynamicSunStation({ azimuthDeg = 135, elevationDeg = 31.4, shelterHeight = 3 }: {
  azimuthDeg?: number
  elevationDeg?: number
  shelterHeight?: number
}) {
  const azRad = (azimuthDeg * Math.PI) / 180
  const elRad = Math.max(0.08, (elevationDeg * Math.PI) / 180)
  const dist = 22

  const x = Math.sin(azRad) * Math.cos(elRad) * dist
  const y = Math.sin(elRad) * dist
  const z = Math.cos(azRad) * Math.cos(elRad) * dist

  // Dynamic Sun Orbit Curve
  const orbitPoints = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let a = 35; a <= 235; a += 5) {
      const rad = (a * Math.PI) / 180
      const el = Math.sin(((a - 35) / 200) * Math.PI) * 48
      const elR = Math.max(0.05, (el * Math.PI) / 180)
      const px = Math.sin(rad) * Math.cos(elR) * dist
      const py = Math.sin(elR) * dist
      const pz = Math.cos(rad) * Math.cos(elR) * dist
      pts.push(new THREE.Vector3(px, py, pz))
    }
    return pts
  }, [dist])

  const orbitCurve = useMemo(() => new THREE.CatmullRomCurve3(orbitPoints), [orbitPoints])

  return (
    <group>
      {/* Golden Celestial Sun Orbit Arc Line */}
      <mesh>
        <tubeGeometry args={[orbitCurve, 64, 0.06, 8, false]} />
        <meshBasicMaterial color="#FACC15" transparent opacity={0.65} />
      </mesh>

      {/* Sun Station Sphere */}
      <group position={[x, y, z]}>
        <mesh>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshBasicMaterial color="#FEF08A" />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.8, 16, 16]} />
          <meshBasicMaterial color="#FDE047" transparent opacity={0.3} />
        </mesh>
        <pointLight intensity={2.8} distance={70} color="#FFFBEB" castShadow />
      </group>

      {/* Solar Rays pointing to Shelter */}
      {[-2, 0, 2].map((off, i) => (
        <mesh key={i} position={[(x + off) / 2, (y + shelterHeight) / 2, z / 2]} rotation={[Math.atan2(z, y), 0, Math.atan2(x - off, y)]}>
          <cylinderGeometry args={[0.02, 0.02, Math.sqrt(x * x + y * y + z * z) * 0.8, 4]} />
          <meshBasicMaterial color="#FDE047" transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  )
}

// Ground Compass Ring
function GroundCompassRing({ radius }: { radius: number }) {
  return (
    <group position={[0, 0.02, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius, radius + 0.1, 64]} />
        <meshBasicMaterial color="#0EA5E9" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 0.05, -radius]}>
        <coneGeometry args={[0.3, 0.7, 4]} />
        <meshBasicMaterial color="#0EA5E9" />
      </mesh>
      <Html position={[0, 0.1, -radius - 0.7]} center>
        <span className="text-sky-400 text-xs font-mono font-bold bg-slate-900/90 px-1.5 py-0.5 rounded border border-sky-500/40">N</span>
      </Html>
      <Html position={[radius + 0.7, 0.1, 0]} center>
        <span className="text-slate-300 text-xs font-mono font-bold">E</span>
      </Html>
      <Html position={[0, 0.1, radius + 0.7]} center>
        <span className="text-slate-300 text-xs font-mono font-bold">S</span>
      </Html>
      <Html position={[-radius - 0.7, 0.1, 0]} center>
        <span className="text-slate-300 text-xs font-mono font-bold">W</span>
      </Html>
    </group>
  )
}

// Animated Convective & Conductive Heat Wave Particles
function HeatFlowParticles({ length, width, height, losing }: { length: number; width: number; height: number; losing: boolean }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!group.current) return
    group.current.children.forEach((child, i) => {
      const t = (state.clock.elapsedTime * 0.85 + i * 0.2) % 1.8
      child.position.y = losing ? height + 0.2 + t * 1.0 : height + 2.0 - t * 1.0
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
      if (mat) mat.opacity = Math.max(0, 1 - t / 1.8)
    })
  })

  const gridPoints = useMemo(() => {
    const pts: [number, number, number][] = []
    const stepX = length / 3
    const stepZ = width / 2
    for (let x = -length / 2 + stepX / 2; x < length / 2; x += stepX) {
      for (let z = -width / 2 + stepZ / 2; z < width / 2; z += stepZ) {
        pts.push([x, 0, z])
      }
    }
    return pts
  }, [length, width])

  return (
    <group ref={group}>
      {gridPoints.map((p, i) => (
        <mesh key={i} position={[p[0], height, p[2]]} rotation={[losing ? 0 : Math.PI, 0, 0]}>
          <coneGeometry args={[0.11, 0.35, 8]} />
          <meshBasicMaterial color={losing ? '#EF4444' : '#38BDF8'} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// Vibrant High-Contrast Building Model
function VibrantShelterBuilding({ geometry, view, currentResult }: Props) {
  const { lengthM: L, widthM: W, heightM: H, roofHeightM: RH, numWindows, numDoors, windowAreaM2 } = geometry
  const wallTexture = useVibrantWallTexture()

  const wallColor = useMemo(() => {
    if (view === 'thermal' && currentResult) {
      const indoorTemp = 'avgIndoorTempC' in currentResult ? currentResult.avgIndoorTempC : currentResult.indoorTempC
      return tempToColor(indoorTemp)
    }
    return new THREE.Color('#EA580C')
  }, [view, currentResult])

  const isWireframe = view === 'wireframe'

  return (
    <group position={[0, 0, 0]}>
      {/* Plinth Base */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[L + 0.8, 0.3, W + 0.8]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>

      {/* Main Walls */}
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[L, H, W]} />
        <meshStandardMaterial
          color={view === 'thermal' ? wallColor : '#EA580C'}
          map={view === 'thermal' ? null : wallTexture}
          wireframe={isWireframe}
          roughness={0.5}
          metalness={0.1}
          transparent={view === 'wireframe'}
          opacity={view === 'wireframe' ? 0.35 : 1}
        />
      </mesh>

      {/* High-Visibility CAD Edge Outlines */}
      <lineSegments position={[0, H / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(L, H, W)]} />
        <lineBasicMaterial color="#38BDF8" linewidth={2.5} />
      </lineSegments>

      {/* Monoslope Shed Roof (Cobalt Blue Metallic) */}
      <group position={[0, H, 0]}>
        <mesh position={[0, RH / 2 + 0.1, 0]} rotation={[0.18, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[L + 0.6, 0.2, W + 0.6]} />
          <meshStandardMaterial color="#0284C7" roughness={0.2} metalness={0.7} />
        </mesh>
        {/* Chimney Pipe */}
        <mesh position={[L / 3, RH + 0.6, -W / 4]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 1.4, 16]} />
          <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Trombe Solar Mass Wall (Warm Amber & Glass) */}
      <group position={[0, H * 0.45, W / 2 + 0.04]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[L * 0.4, H * 0.7, 0.15]} />
          <meshStandardMaterial color="#D97706" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.1]}>
          <boxGeometry args={[L * 0.42, H * 0.72, 0.04]} />
          <meshPhysicalMaterial
            color="#38BDF8"
            transmission={0.85}
            opacity={0.8}
            transparent
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      </group>

      {/* Arctic Airlock Vestibule Box */}
      <group position={[-L / 2 - 0.5, 1.0, 0]} castShadow receiveShadow>
        <mesh>
          <boxGeometry args={[1.0, 2.0, 1.4]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
        <mesh position={[-0.51, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <boxGeometry args={[0.9, 1.8, 0.05]} />
          <meshStandardMaterial color="#0EA5E9" roughness={0.3} />
        </mesh>
      </group>

      {/* Glazing & Window Frame */}
      {Array.from({ length: numWindows }).map((_, i) => {
        const spacing = L / (numWindows + 1)
        const x = -L / 2 + spacing * (i + 1)
        const winDim = Math.min(1.2, Math.sqrt(windowAreaM2))
        return (
          <group key={i} position={[x, H * 0.55, W / 2 + 0.02]}>
            <mesh>
              <boxGeometry args={[winDim + 0.12, winDim * 0.85 + 0.12, 0.06]} />
              <meshStandardMaterial color="#1E293B" roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <boxGeometry args={[winDim, winDim * 0.8, 0.02]} />
              <meshPhysicalMaterial
                color="#06B6D4"
                transmission={0.9}
                opacity={0.85}
                transparent
                roughness={0.05}
                metalness={0.95}
              />
            </mesh>
          </group>
        )
      })}

      {/* Door */}
      {Array.from({ length: numDoors }).map((_, i) => (
        <group key={i} position={[0, 0.95, -W / 2 - 0.02]}>
          <mesh>
            <boxGeometry args={[1.05, 1.95, 0.08]} />
            <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0, -0.01]}>
            <boxGeometry args={[0.9, 1.8, 0.05]} />
            <meshStandardMaterial color="#64748B" roughness={0.5} metalness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Floating Dynamic Badges */}
      <group>
        <Html position={[0, H + RH + 0.4, 0]} center>
          <div className="bg-slate-900/95 backdrop-blur border border-sky-400 text-sky-300 text-[11px] font-bold px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 whitespace-nowrap pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            Monoslope Roof (11°)
          </div>
        </Html>

        <Html position={[0, H * 0.45, W / 2 + 0.3]} center>
          <div className="bg-slate-900/95 backdrop-blur border border-amber-400 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 whitespace-nowrap pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Trombe Mass Wall
          </div>
        </Html>

        <Html position={[-L / 2 - 1.2, 1.0, 0]} center>
          <div className="bg-slate-900/95 backdrop-blur border border-emerald-400 text-emerald-300 text-[11px] font-bold px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 whitespace-nowrap pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Arctic Airlock Vestibule
          </div>
        </Html>

        {/* Dynamic Dimensions */}
        <Html position={[0, -0.4, W / 2 + 0.3]} center>
          <div className="bg-slate-950 text-sky-400 text-[12px] font-mono font-bold px-2.5 py-0.5 rounded shadow-xl border border-sky-500/50 pointer-events-none">
            {L.toFixed(1)}m L
          </div>
        </Html>

        <Html position={[-L / 2 - 0.3, -0.4, 0]} center>
          <div className="bg-slate-950 text-sky-400 text-[12px] font-mono font-bold px-2.5 py-0.5 rounded shadow-xl border border-sky-500/50 pointer-events-none">
            {W.toFixed(1)}m W
          </div>
        </Html>

        <Html position={[-L / 2 - 0.3, H / 2, W / 2]} center>
          <div className="bg-slate-950 text-sky-400 text-[12px] font-mono font-bold px-2.5 py-0.5 rounded shadow-xl border border-sky-500/50 pointer-events-none">
            {H.toFixed(1)}m H
          </div>
        </Html>
      </group>

      {/* Heat Wave Stream Animation */}
      {view === 'thermal' && (
        <HeatFlowParticles length={L} width={W} height={H + RH} losing={currentResult && 'netHeatFlowW' in currentResult ? currentResult.netHeatFlowW < 0 : true} />
      )}
    </group>
  )
}

export default function Shelter3D(props: Props) {
  const { project, setProject } = useProject()
  const navigate = useNavigate()

  const [view, setView] = useState<NonNullable<Props['view']>>(props.view ?? 'solid')
  const [autoRotate, setAutoRotate] = useState(false)
  const [showDesignNotes, setShowDesignNotes] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const maxDim = Math.max(props.geometry.lengthM, props.geometry.widthM) + 6
  const az = props.sunAzimuthDeg ?? 135
  const el = props.sunElevationDeg ?? 31.4

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults([]); return }
    setSearchLoading(true)
    const results = await searchLocation(q)
    setSearchResults(results)
    setSearchLoading(false)
  }, [])

  async function selectLocation(place: any) {
    setSearchQuery('')
    setSearchResults([])
    const [snap, elev] = await Promise.all([
      getClimate(place.lat, place.lng),
      getElevation(place.lat, place.lng),
    ])
    setProject((p) => ({
      ...p,
      location: {
        ...p.location,
        name: place.name,
        lat: place.lat,
        lng: place.lng,
        altitudeM: elev ?? p.location.altitudeM,
      },
      climate: snap,
    }))
  }

  function handleRunSimulation() {
    setView('thermal')
    if (props.onRunSimulation) {
      props.onRunSimulation()
    } else {
      navigate('/simulation')
    }
  }

  const [showLocationModal, setShowLocationModal] = useState(false)

  const INDIAN_DEFENSE_LOCATIONS = [
    { name: '🏔️ Siachen Base Camp, Ladakh', lat: 35.4212, lng: 77.1095, alt: 3600 },
    { name: '🥶 Dras (Coldest Inhabited Zone), Kargil', lat: 34.4283, lng: 75.7663, alt: 3280 },
    { name: '🏔️ Leh, Ladakh', lat: 34.1526, lng: 77.5771, alt: 3500 },
    { name: '🏔️ Tawang, Arunachal Pradesh', lat: 27.5861, lng: 91.8594, alt: 3048 },
    { name: '🏜️ Jaisalmer, Rajasthan', lat: 26.9157, lng: 70.9083, alt: 225 },
    { name: '🏝️ Port Blair, Andaman & Nicobar', lat: 11.6234, lng: 92.7265, alt: 15 },
    { name: '❄️ Srinagar, Jammu & Kashmir', lat: 34.0837, lng: 74.7973, alt: 1585 },
    { name: '🌲 Shimla, Himachal Pradesh', lat: 31.1048, lng: 77.1734, alt: 2276 },
  ]

  return (
    <div className="relative rounded-2xl border border-slate-700 bg-slate-950 overflow-hidden shadow-2xl">
      {/* ── Top Header Studio Toolbar (Dynamic Location Search & Navigation) ────── */}
      <div className="bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-xs text-slate-300 hover:text-white cursor-pointer font-medium flex items-center gap-1">
            ← Dashboard
          </button>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5 font-display font-bold text-sm text-white tracking-wide">
            THERMA <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/40 font-mono">STUDIO</span>
          </div>
          <span className="text-slate-700">|</span>
          <button
            onClick={() => setShowLocationModal(true)}
            title="Click to Change Location"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-xs text-white px-3 py-1 rounded-full border border-slate-700 shadow-md transition-all cursor-pointer group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <MapPin size={12} className="text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-white group-hover:text-sky-300 transition-colors">{props.locationName ?? project.location.name}</span>
            <span className="text-slate-400">· {(props.altitudeM ?? project.location.altitudeM).toFixed(0)}m ASL</span>
            <span className="text-sky-300 font-mono font-bold">{(props.tempC ?? project.climate.tempC).toFixed(1)}°C</span>
            <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-mono">Change ▾</span>
          </button>
        </div>

        {/* Dynamic Location Command Search */}
        <div className="flex items-center gap-2 relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
              {searchLoading ? <Loader2 size={13} className="animate-spin text-slate-400" /> : <Search size={13} className="text-slate-400" />}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search location (e.g. Siachen, Leh, Dras)…"
              className="bg-slate-800 border border-slate-700 text-xs text-white pl-8 pr-7 py-1.5 rounded-lg w-64 outline-none focus:border-sky-400 shadow-inner"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]) }} className="absolute right-2 top-2 text-slate-400 hover:text-white">
                <X size={12} />
              </button>
            )}
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                {searchResults.map((p, i) => (
                  <button key={i} onClick={() => selectLocation(p)} className="w-full text-left px-3 py-2 text-xs text-white hover:bg-sky-500/20 border-b border-slate-800 last:border-0 flex items-center gap-2">
                    <MapPin size={12} className="text-sky-400 shrink-0" />
                    <span className="truncate">{p.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs font-mono bg-sky-500/20 text-sky-300 px-2.5 py-1 rounded border border-sky-500/40">
            01 Design Studio
          </span>
        </div>
      </div>

      {/* ── Left Vertical Floating Dock ───────────────────────────────────── */}
      <div className="absolute top-16 left-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur border border-slate-700 p-1.5 rounded-xl shadow-2xl">
        <button onClick={() => setView('solid')} title="Solid View" className={`p-2 rounded-lg transition-colors ${view === 'solid' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}>
          <Paperclip size={16} />
        </button>
        <button onClick={() => setView('cad')} title="Layers & CAD View" className={`p-2 rounded-lg transition-colors ${view === 'cad' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}>
          <Layers size={16} />
        </button>
        <button onClick={() => setView('solar')} title="Solar Celestial View" className={`p-2 rounded-lg transition-colors ${view === 'solar' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}>
          <Sun size={16} />
        </button>
        <button onClick={() => setView('thermal')} title="Thermal Convective Heat Wave" className={`p-2 rounded-lg transition-colors ${view === 'thermal' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}>
          <Snowflake size={16} />
        </button>
        <button onClick={() => setView('wireframe')} title="Wireframe Mesh" className={`p-2 rounded-lg transition-colors ${view === 'wireframe' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}>
          <BoxIcon size={16} />
        </button>
      </div>

      {/* ── Top Right Solar Celestial Status Badge ────────────────────────────── */}
      <div className="absolute top-16 right-4 z-20 bg-slate-900/90 backdrop-blur border border-slate-700 px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-2.5">
        <Sun size={18} className="text-amber-400" />
        <div className="text-right">
          <div className="text-[11px] font-bold text-white">Solar Celestial Station</div>
          <div className="text-[10px] text-sky-300 font-mono">12:00 PM · {el.toFixed(1)}° Alt</div>
        </div>
      </div>

      {/* ── 3D Canvas Viewport ───────────────────────────────────────────── */}
      <div style={{ height: 500 }}>
        <Canvas
          shadows
          camera={{
            position: [maxDim * 0.9, maxDim * 0.6, maxDim * 0.9],
            fov: 38,
          }}
        >
          <color attach="background" args={['#CBD5E1']} />
          <ambientLight intensity={0.75} />

          {/* Dynamic Celestial Sun Orbit Station */}
          <DynamicSunStation azimuthDeg={az} elevationDeg={el} shelterHeight={props.geometry.heightM} />

          {/* Ground Receiver Plane */}
          <mesh position={[0, -0.3, 0]} receiveShadow>
            <planeGeometry args={[120, 120]} />
            <meshStandardMaterial color="#94A3B8" roughness={0.9} />
          </mesh>

          {/* Ground Degree Compass Ring */}
          <GroundCompassRing radius={Math.max(props.geometry.lengthM, props.geometry.widthM) * 1.1} />

          {/* Dynamic Vibrant Building Geometry */}
          <VibrantShelterBuilding {...props} view={view} />

          <OrbitControls
            makeDefault
            autoRotate={autoRotate}
            autoRotateSpeed={1.8}
            minDistance={4}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2.02}
          />
        </Canvas>
      </div>

      {/* ── Bottom Floating Action Controls Toolbar ─────────────────────────────── */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setAutoRotate((v) => !v)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono backdrop-blur border shadow-2xl flex items-center gap-1.5 transition-all ${
              autoRotate ? 'bg-sky-500 text-slate-950 font-bold border-sky-400' : 'bg-slate-900/90 text-white border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Compass size={13} className={autoRotate ? 'animate-spin' : 'text-sky-400'} />
            360° Orbit {autoRotate ? 'ON' : 'OFF'} · {az.toFixed(0)}° Azimuth
          </button>
          <div className="bg-slate-900/90 backdrop-blur border border-slate-700 text-white text-xs px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5">
            <Mountain size={13} className="text-amber-400" /> Alpine Zone ({(props.altitudeM ?? project.location.altitudeM).toFixed(0)}m)
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowDesignNotes(true)}
            className="bg-slate-900/90 backdrop-blur border border-slate-700 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-xl shadow-2xl flex items-center gap-1.5 transition-colors"
          >
            <FileText size={13} /> Design Notes
          </button>

          <button
            onClick={() => setShowMaterialModal(true)}
            className="bg-slate-900/90 backdrop-blur border border-sky-500/40 hover:bg-slate-800 text-sky-300 text-xs font-medium px-3.5 py-1.5 rounded-xl shadow-2xl flex items-center gap-1.5 transition-colors"
          >
            <Sparkles size={13} className="text-sky-400" /> Material Suggestion
          </button>

          <button
            onClick={handleRunSimulation}
            className="bg-sky-500 text-slate-950 font-bold hover:bg-sky-400 text-xs px-4 py-1.5 rounded-xl shadow-2xl flex items-center gap-1.5 transition-all"
          >
            <Play size={13} className="fill-current" /> Run Simulation
          </button>

          <button
            onClick={() => setView('solid')}
            className="bg-slate-900/90 backdrop-blur border border-slate-700 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-xl shadow-2xl flex items-center gap-1.5 transition-colors"
          >
            <BoxIcon size={13} /> Isometric
          </button>

          <button
            onClick={() => setView('solar')}
            className="bg-slate-900/90 backdrop-blur border border-slate-700 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-xl shadow-2xl flex items-center gap-1.5 transition-colors"
          >
            <Sun size={13} className="text-amber-400" /> South Glazing
          </button>
        </div>
      </div>

      {/* ── Slide-Over Modal: Design Notes Drawer ────────────────────────────── */}
      {showDesignNotes && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-sky-400" />
                <h3 className="font-display font-bold text-lg text-white">Architectural Design Notes</h3>
              </div>
              <button onClick={() => setShowDesignNotes(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-xs space-y-0">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-sky-400 uppercase tracking-wider">Building Envelope</div>
                <div className="text-slate-300">Shelter Geometry: {props.geometry.lengthM.toFixed(1)}m L × {props.geometry.widthM.toFixed(1)}m W × {props.geometry.heightM.toFixed(1)}m H</div>
                <div className="text-slate-300">Monoslope Roof Pitch: 11° shedding snow/wind load toward North.</div>
                <div className="text-slate-300">Trombe Mass Wall: South-facing heat storage absorber.</div>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-emerald-400 uppercase tracking-wider">Thermal Balance</div>
                <div className="text-slate-300">Outdoor Climate: {(props.tempC ?? project.climate.tempC).toFixed(1)}°C at {(props.altitudeM ?? project.location.altitudeM).toFixed(0)}m ASL</div>
                <div className="text-slate-300">Arctic Airlock Vestibule prevents direct wind chill entrance infiltration.</div>
                <div className="text-slate-300">Glazing Ratio: {props.geometry.windowAreaM2.toFixed(1)}m² double-pane low-E glass.</div>
              </div>
            </div>
          </div>

          <button onClick={() => setShowDesignNotes(false)} className="mt-4 w-full py-2 bg-sky-500 text-slate-950 font-bold rounded-xl">
            Close Design Notes
          </button>
        </div>
      )}

      {/* ── Slide-Over Modal: Material Suggestion Drawer ───────────────────────── */}
      {showMaterialModal && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                <h3 className="font-display font-bold text-lg text-white">DRDO Thermal Material Upgrades</h3>
              </div>
              <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-900 p-4 rounded-xl border border-sky-500/40 flex items-start gap-3">
                <Shield size={20} className="text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-sm">DRDO Silica Aerogel Blanket (Nanoporous)</div>
                  <div className="text-slate-300 mt-1">Thermal Conductivity: k = 0.014 W/m·K. Extreme altitude thermal resistance for sub-zero habitats.</div>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-amber-500/40 flex items-start gap-3">
                <Thermometer size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-sm">Paraffin Bio-PCM Thermal Storage Tile (21°C)</div>
                  <div className="text-slate-300 mt-1">Latent Heat: 195,000 J/kg. Absorbs daytime solar heat spikes and releases energy overnight.</div>
                </div>
              </div>
            </div>
          </div>

          <button onClick={() => setShowMaterialModal(false)} className="mt-4 w-full py-2 bg-amber-400 text-slate-950 font-bold rounded-xl">
            Close Material Suggestions
          </button>
        </div>
      )}

      {/* ── Slide-Over Modal: Quick Location Switcher Drawer ─────────────────── */}
      {showLocationModal && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-sky-400" />
                <h3 className="font-display font-bold text-lg text-white">Select Site Location</h3>
              </div>
              <button onClick={() => setShowLocationModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
                🇮🇳 Indian Defense & Extreme Deployment Sites
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                {INDIAN_DEFENSE_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => {
                      selectLocation(loc)
                      setShowLocationModal(false)
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/80 transition-all text-left text-xs group"
                  >
                    <div>
                      <div className="font-bold text-white group-hover:text-sky-300 transition-colors">{loc.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{loc.lat.toFixed(2)}°N, {loc.lng.toFixed(2)}°E</div>
                    </div>
                    <span className="text-[11px] font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/30 shrink-0">
                      {loc.alt}m
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setShowLocationModal(false)
                  navigate('/map')
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors mt-2"
              >
                <MapPin size={14} /> Open Full Map Explorer
              </button>
            </div>
          </div>

          <button onClick={() => setShowLocationModal(false)} className="mt-4 w-full py-2 bg-sky-500 text-slate-950 font-bold rounded-xl">
            Close Location Switcher
          </button>
        </div>
      )}
    </div>
  )
}
