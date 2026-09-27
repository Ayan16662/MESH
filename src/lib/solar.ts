// Simplified solar position algorithm (NOAA-style approximation).
// Good enough for visualization and orientation-factor purposes; not
// survey-grade ephemeris accuracy.
export interface SunPosition {
  elevationDeg: number
  azimuthDeg: number
}

export function sunPosition(lat: number, lng: number, date: Date, hourDecimal: number): SunPosition {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
  )
  const declRad = 23.45 * (Math.PI / 180) * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365)
  const latRad = (lat * Math.PI) / 180

  // equation of time correction (minutes), simplified
  const b = (2 * Math.PI * (dayOfYear - 81)) / 364
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b)
  const timeCorrectionMin = 4 * lng + eot
  const solarTime = hourDecimal + timeCorrectionMin / 60
  const hourAngleDeg = 15 * (solarTime - 12)
  const hourAngleRad = (hourAngleDeg * Math.PI) / 180

  const sinElev = Math.sin(latRad) * Math.sin(declRad) + Math.cos(latRad) * Math.cos(declRad) * Math.cos(hourAngleRad)
  const elevationDeg = (Math.asin(Math.max(-1, Math.min(1, sinElev))) * 180) / Math.PI

  const cosAz =
    (Math.sin(declRad) - Math.sin(latRad) * sinElev) / (Math.cos(latRad) * Math.cos(Math.asin(sinElev)) || 1e-6)
  let azimuthDeg = (Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180) / Math.PI
  if (hourAngleDeg > 0) azimuthDeg = 360 - azimuthDeg

  return { elevationDeg, azimuthDeg }
}
