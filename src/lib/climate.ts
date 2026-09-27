import axios from 'axios'

// ─── Geocoding helpers (Nominatim – no API key required) ─────────────────────
const NOMINATIM = 'https://nominatim.openstreetmap.org'

export interface GeoPlace {
  display_name: string
  name: string
  lat: number
  lng: number
  country: string
  state?: string
  city?: string
}

import type { ClimateSnapshot, HourlyClimate } from '../types'
import { LADAKH_DEMO_CLIMATE } from '../data/ladakhDemo'

const BASE = import.meta.env.VITE_CLIMATE_API_BASE || 'https://api.open-meteo.com/v1/forecast'

// ClimateService abstraction: swap getLiveClimate's implementation for any
// other provider (OpenWeather, custom) without touching calling code —
// callers only depend on the ClimateSnapshot shape.
export async function getLiveClimate(lat: number, lng: number): Promise<ClimateSnapshot> {
  const params = {
    latitude: lat,
    longitude: lng,
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,cloud_cover,surface_pressure,precipitation,shortwave_radiation',
    hourly: 'temperature_2m,shortwave_radiation,wind_speed_10m,relative_humidity_2m,cloud_cover',
    forecast_days: 1,
    timezone: 'auto',
  }
  const { data } = await axios.get(BASE, { params, timeout: 8000 })

  const hourly: HourlyClimate = {
    hour: (data.hourly.time as string[]).map((t) => new Date(t).getHours()),
    tempC: data.hourly.temperature_2m,
    solarWm2: data.hourly.shortwave_radiation,
    windSpeedMs: data.hourly.wind_speed_10m,
    humidityPct: data.hourly.relative_humidity_2m,
    cloudCoverPct: data.hourly.cloud_cover,
  }

  return {
    source: 'live',
    tempC: data.current.temperature_2m,
    humidityPct: data.current.relative_humidity_2m,
    windSpeedMs: data.current.wind_speed_10m,
    windDirDeg: data.current.wind_direction_10m,
    solarWm2: data.current.shortwave_radiation ?? 0,
    cloudCoverPct: data.current.cloud_cover,
    pressureHpa: data.current.surface_pressure,
    precipMm: data.current.precipitation ?? 0,
    hourly,
  }
}

export async function getClimate(lat: number, lng: number): Promise<ClimateSnapshot> {
  try {
    return await getLiveClimate(lat, lng)
  } catch {
    // Graceful fallback — clearly labeled DEMO DATA by ClimateSnapshot.source
    return LADAKH_DEMO_CLIMATE
  }
}

/** Rough elevation estimate — Open-Meteo has no key-free elevation endpoint bundled here,
 *  so altitude is either user-entered or left at a sensible default the user can edit. */
export async function getElevation(lat: number, lng: number): Promise<number | null> {
  try {
    const { data } = await axios.get('https://api.open-meteo.com/v1/elevation', {
      params: { latitude: lat, longitude: lng },
      timeout: 6000,
    })
    return data.elevation?.[0] ?? null
  } catch {
    return null
  }
}

/** Reverse geocode a lat/lng into a human-readable place name. */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoPlace | null> {
  try {
    const { data } = await axios.get(`${NOMINATIM}/reverse`, {
      params: { lat, lon: lng, format: 'json', 'accept-language': 'en' },
      headers: { 'User-Agent': 'THERMA-App/1.0' },
      timeout: 6000,
    })
    const addr = data.address ?? {}
    return {
      display_name: data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      name: addr.city ?? addr.town ?? addr.village ?? addr.county ?? addr.state ?? data.name ?? 'Unknown Location',
      lat,
      lng,
      country: addr.country ?? '',
      state: addr.state,
      city: addr.city ?? addr.town ?? addr.village,
    }
  } catch {
    return null
  }
}

/** Search for a place by name — prioritizes Indian locations and defense zones. */
export async function searchLocation(query: string): Promise<GeoPlace[]> {
  if (!query.trim()) return []
  try {
    const { data } = await axios.get(`${NOMINATIM}/search`, {
      params: {
        q: query.toLowerCase().includes('india') ? query : `${query}, India`,
        format: 'json',
        limit: 8,
        'accept-language': 'en',
      },
      headers: { 'User-Agent': 'THERMA-App/1.0' },
      timeout: 6000,
    })
    
    // If specific search with ', India' returned no results, retry global query
    let results = data as any[]
    if (results.length === 0) {
      const fallback = await axios.get(`${NOMINATIM}/search`, {
        params: { q: query, format: 'json', limit: 8, 'accept-language': 'en' },
        headers: { 'User-Agent': 'THERMA-App/1.0' },
        timeout: 6000,
      })
      results = fallback.data as any[]
    }

    return results.map((r) => ({
      display_name: r.display_name,
      name: r.display_name.split(',')[0].trim(),
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      country: r.address?.country ?? 'India',
      state: r.address?.state,
      city: r.address?.city ?? r.address?.town ?? r.address?.village,
    }))
  } catch {
    return []
  }
}
