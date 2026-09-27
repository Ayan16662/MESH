/**
 * LocationMap — Full-featured interactive map for pinpointing shelter sites.
 *
 * Features:
 *  • Search bar with Nominatim autocomplete
 *  • Click-to-pin / drag-to-move marker
 *  • Reverse geocoding (auto place name)
 *  • Map style switcher: Street · Satellite · Terrain · Dark
 *  • Animated fly-to when location changes
 *  • Climate / altitude mini-panel inside the map
 *  • Coordinate copy-to-clipboard
 *  • Crosshair cursor while in "pick" mode
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  MapContainer, TileLayer, Marker, useMapEvents,
  useMap, ZoomControl, ScaleControl,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Search, MapPin, Layers, X, Loader2, Wind,
  Thermometer, Droplets, Sun, Mountain, Copy, CheckCheck,
  Navigation2,
} from 'lucide-react'
import {
  reverseGeocode, searchLocation,
} from '../lib/climate'
import type { ClimateSnapshot } from '../types'
import type { GeoPlace } from '../lib/climate'
import type { Location } from '../types'

// Fix Leaflet default icon broken by Vite
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

// Custom cyan THERMA pin
const THERMA_ICON = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:32px;height:42px">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
      <defs><filter id="ds"><feDropShadow dx="0" dy="2" stdDeviation="3"
        flood-color="#000" flood-opacity="0.55"/></filter></defs>
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26s16-16 16-26C32 7.163 24.837 0 16 0z"
            fill="#4FD1E8" filter="url(#ds)"/>
      <circle cx="16" cy="16" r="7" fill="#0A1018"/>
      <circle cx="16" cy="16" r="4" fill="#4FD1E8" opacity="0.9"/>
    </svg>
  </div>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
})

// Map tile styles
const MAP_STYLES = {
  Satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '© Esri, Maxar, Earthstar Geographics',
  },
  Dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attr: '© Esri, HERE, Garmin, USGS',
  },
  Street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '© OpenStreetMap contributors',
  },
  Terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: '© OpenStreetMap, SRTM © OpenTopoMap',
  },
} as const
type MapStyle = keyof typeof MAP_STYLES

function MapInitializer() {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 150)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

// Fly-to when lat/lng changes externally
function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  const prev = useRef({ lat, lng })
  useEffect(() => {
    if (prev.current.lat !== lat || prev.current.lng !== lng) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 9), { duration: 1.4 })
      prev.current = { lat, lng }
    }
  }, [lat, lng, map])
  return null
}

function ClickHandler({ onPick, picking }: {
  onPick: (lat: number, lng: number) => void
  picking: boolean
}) {
  const map = useMapEvents({
    click(e) { if (picking) onPick(e.latlng.lat, e.latlng.lng) },
  })
  useEffect(() => {
    map.getContainer().style.cursor = picking ? 'crosshair' : ''
  }, [map, picking])
  return null
}

// Props
export interface LocationMapProps {
  lat: number
  lng: number
  altitudeM?: number
  climate?: ClimateSnapshot
  locationName?: string
  onPick: (lat: number, lng: number) => void
  onLocationResolved?: (loc: Partial<Location> & { name: string }) => void
  height?: number
  showClimatePanel?: boolean
}

export default function LocationMap({
  lat, lng, altitudeM, climate, locationName,
  onPick, onLocationResolved,
  height = 440, showClimatePanel = true,
}: LocationMapProps) {
  const [mapStyle, setMapStyle] = useState<MapStyle>('Satellite')
  const [showStylePicker, setShowStylePicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GeoPlace[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [picking, setPicking] = useState(true)
  const [resolvedName, setResolvedName] = useState(locationName ?? '')
  const [resolving, setResolving] = useState(false)
  const [copied, setCopied] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reverse geocode on lat/lng change
  useEffect(() => {
    let cancelled = false
    setResolving(true)
    reverseGeocode(lat, lng).then((place) => {
      if (cancelled) return
      setResolving(false)
      if (place) {
        setResolvedName(place.name)
        onLocationResolved?.({ name: place.name, lat, lng, region: place.state, country: place.country })
      } else {
        setResolvedName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
      }
    })
    return () => { cancelled = true }
  }, [lat, lng]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q)
    if (debounce.current) clearTimeout(debounce.current)
    if (!q.trim()) { setSearchResults([]); return }
    debounce.current = setTimeout(async () => {
      setSearchLoading(true)
      const results = await searchLocation(q)
      setSearchResults(results)
      setSearchLoading(false)
    }, 380)
  }, [])

  function selectResult(place: GeoPlace) {
    setSearchQuery(''); setSearchResults([])
    onPick(place.lat, place.lng)
  }

  function copyCoords() {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    })
  }

  const windLabel = (deg: number) => ['N','NE','E','SE','S','SW','W','NW'][Math.round(deg / 45) % 8]

  const INDIAN_PRESETS = [
    { name: '🏔️ Siachen (5,400m)', lat: 35.4212, lng: 77.1095 },
    { name: '🥶 Dras (3,280m)', lat: 34.4283, lng: 75.7663 },
    { name: '🏔️ Leh Ladakh (3,500m)', lat: 34.1526, lng: 77.5771 },
    { name: '🏔️ Tawang (3,048m)', lat: 27.5861, lng: 91.8594 },
    { name: '🏜️ Jaisalmer (225m)', lat: 26.9157, lng: 70.9083 },
    { name: '🏝️ Port Blair (15m)', lat: 11.6234, lng: 92.7265 },
  ]

  return (
    <div className="relative rounded-xl border border-line overflow-hidden" style={{ height }}>

      {/* Search bar & Indian presets */}
      <div className="absolute top-3 left-3 right-3 z-[1000] space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              {searchLoading
                ? <Loader2 size={14} className="animate-spin text-slate" />
                : <Search size={14} className="text-slate" />}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search Indian city, district, Siachen, Dras, Leh, Tawang, Jaisalmer…"
              className="w-full bg-panel/95 backdrop-blur border border-line rounded-lg
                         pl-8 pr-8 py-2 text-sm text-frost placeholder-slate
                         outline-none focus:border-ice/60 shadow-xl"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                className="absolute inset-y-0 right-3 flex items-center text-slate hover:text-frost">
                <X size={13} />
              </button>
            )}
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1.5 left-0 right-0 bg-panel border border-line
                              rounded-lg shadow-2xl overflow-hidden z-50">
                {searchResults.map((p, i) => (
                  <button key={i} onClick={() => selectResult(p)}
                    className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left
                               hover:bg-ice/10 transition-colors border-b border-line last:border-0">
                    <MapPin size={13} className="text-ice mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm text-frost font-medium leading-tight">{p.name}</div>
                      <div className="text-[11px] text-slate mt-0.5 line-clamp-1">{p.display_name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Layer switcher */}
          <div className="relative">
            <button onClick={() => setShowStylePicker((v) => !v)}
              className="flex items-center gap-1.5 bg-panel/95 backdrop-blur border border-line
                         rounded-lg px-3 py-2 text-xs text-slate hover:text-frost hover:border-ice/40
                         shadow-xl transition-colors whitespace-nowrap">
              <Layers size={13} />
              {mapStyle}
            </button>
            {showStylePicker && (
              <div className="absolute top-full mt-1.5 right-0 bg-panel border border-line
                              rounded-lg shadow-2xl overflow-hidden z-50 min-w-[110px]">
                {(Object.keys(MAP_STYLES) as MapStyle[]).map((s) => (
                  <button key={s} onClick={() => { setMapStyle(s); setShowStylePicker(false) }}
                    className={`w-full px-3 py-2 text-left text-xs transition-colors
                      ${s === mapStyle ? 'bg-ice/15 text-ice font-medium' : 'text-frost hover:bg-ice/10'}`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Indian Presets Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] text-slate bg-panel/90 backdrop-blur px-2 py-1 rounded border border-line shrink-0">
            🇮🇳 Presets:
          </span>
          {INDIAN_PRESETS.map((p) => (
            <button key={p.name} onClick={() => onPick(p.lat, p.lng)}
              className="text-[11px] bg-panel/90 backdrop-blur border border-line/80 hover:border-ice/50
                         text-frost hover:text-ice px-2.5 py-1 rounded-md shrink-0 transition-colors shadow-md">
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Pin mode toggle */}
      <button onClick={() => setPicking((v) => !v)}
        title={picking ? 'Pin mode active — click map to drop pin' : 'Enable pin mode'}
        className={`absolute top-[54px] right-3 z-[1000] flex items-center gap-1.5 px-3 py-1.5
                    rounded-lg text-xs border shadow-lg transition-all backdrop-blur
                    ${picking ? 'bg-ice/20 border-ice/60 text-ice' : 'bg-panel/95 border-line text-slate hover:border-ice/40'}`}>
        <Navigation2 size={12} className={picking ? 'fill-ice' : ''} />
        {picking ? 'Pin Mode ON' : 'Pin Mode OFF'}
      </button>

      {/* Leaflet map */}
      <MapContainer
        center={[lat, lng]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapInitializer />
        <TileLayer
          key={mapStyle}
          attribution={MAP_STYLES[mapStyle].attr}
          url={MAP_STYLES[mapStyle].url}
          maxZoom={19}
        />
        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomleft" />
        <FlyTo lat={lat} lng={lng} />
        <ClickHandler onPick={onPick} picking={picking} />
        <Marker
          position={[lat, lng]}
          icon={THERMA_ICON}
          draggable
          eventHandlers={{
            dragend(e) {
              const { lat: la, lng: ln } = (e.target as L.Marker).getLatLng()
              onPick(la, ln)
            },
          }}
        />
      </MapContainer>

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000]
                      bg-panel/90 backdrop-blur border-t border-line
                      px-4 py-2 flex items-center gap-4 flex-wrap">

        {/* Location name */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MapPin size={13} className="text-ice shrink-0" />
          {resolving
            ? <span className="text-xs text-slate flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" /> Resolving…
              </span>
            : <span className="text-xs text-frost font-medium truncate">
                {resolvedName || 'Click map to pin location'}
              </span>}
        </div>

        {/* Coordinate copy */}
        <button onClick={copyCoords} title="Copy coordinates"
          className="flex items-center gap-1.5 text-xs text-slate hover:text-frost font-data transition-colors shrink-0">
          {copied ? <CheckCheck size={12} className="text-ice" /> : <Copy size={12} />}
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </button>

        {/* Altitude */}
        {altitudeM !== undefined && (
          <div className="flex items-center gap-1 text-xs text-slate shrink-0">
            <Mountain size={12} className="text-ice2" />
            <span className="font-data">{altitudeM.toFixed(0)}</span>
            <span>m asl</span>
          </div>
        )}

        {/* Climate quick badges */}
        {showClimatePanel && climate && (
          <>
            <div className="flex items-center gap-1 text-xs shrink-0">
              <Thermometer size={12} className="text-ember" />
              <span className={`font-data ${climate.tempC < 0 ? 'text-ice2' : 'text-ember2'}`}>
                {climate.tempC.toFixed(1)}°C
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate shrink-0">
              <Wind size={12} className="text-ice" />
              <span className="font-data">{climate.windSpeedMs.toFixed(1)}</span>
              <span>m/s {windLabel(climate.windDirDeg ?? 0)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate shrink-0">
              <Sun size={12} className="text-yellow-400" />
              <span className="font-data">{climate.solarWm2.toFixed(0)}</span>
              <span>W/m²</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate shrink-0">
              <Droplets size={12} className="text-ice" />
              <span className="font-data">{climate.humidityPct.toFixed(0)}%</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0
              ${climate.source === 'live' ? 'bg-ice/15 text-ice2' : 'bg-ember/15 text-ember2'}`}>
              {climate.source === 'live' ? 'LIVE' : 'DEMO'}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
