import type { ClimateSnapshot, HourlyClimate } from '../types'

// DEMO DATA — representative winter 24h profile for Leh, Ladakh (~3500m).
// Used only as an offline fallback when the live climate API is unreachable
// or when the user explicitly loads the demo dataset. Not measured data.
const hour = Array.from({ length: 24 }, (_, i) => i)

const tempC = [
  -14, -14.5, -15, -15.3, -15.5, -15, -13, -9, -5, -1, 2, 4,
  5.5, 6, 5.5, 4, 1, -3, -7, -9.5, -11, -12, -13, -13.5,
]

const solarWm2 = [
  0, 0, 0, 0, 0, 0, 40, 210, 430, 610, 740, 810,
  830, 790, 660, 470, 240, 60, 0, 0, 0, 0, 0, 0,
]

const windSpeedMs = [
  2.1, 1.9, 1.8, 1.8, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0, 4.3, 4.5,
  4.6, 4.5, 4.2, 3.8, 3.3, 2.9, 2.6, 2.4, 2.3, 2.2, 2.1, 2.1,
]

const humidityPct = [
  42, 43, 44, 45, 45, 44, 40, 34, 28, 24, 21, 19,
  18, 18, 20, 24, 29, 34, 38, 40, 41, 42, 42, 42,
]

const cloudCoverPct = [
  10, 10, 10, 12, 12, 10, 8, 8, 10, 12, 14, 15,
  15, 14, 13, 12, 10, 10, 10, 10, 10, 10, 10, 10,
]

export const LADAKH_HOURLY: HourlyClimate = { hour, tempC, solarWm2, windSpeedMs, humidityPct, cloudCoverPct }

export const LADAKH_DEMO_CLIMATE: ClimateSnapshot = {
  source: 'demo',
  tempC: -8.4,
  humidityPct: 32,
  windSpeedMs: 3.1,
  windDirDeg: 290,
  solarWm2: 420,
  cloudCoverPct: 11,
  pressureHpa: 654, // ~3500m altitude
  precipMm: 0,
  hourly: LADAKH_HOURLY,
}

export const LADAKH_LOCATION = {
  name: 'Leh, Ladakh',
  lat: 34.1526,
  lng: 77.5771,
  altitudeM: 3500,
  region: 'Ladakh',
  country: 'India',
}
