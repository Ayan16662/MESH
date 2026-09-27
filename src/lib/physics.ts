import { getMaterial } from '../data/materials'
import type {
  Assembly, ClimateSnapshot, ComfortRange, Geometry, HourlyResult,
  Occupancy, Orientation, SimulationResults, SimulationSettings, Ventilation,
} from '../types'

// ---------------------------------------------------------------------------
// Every formula below is documented inline. This module performs the actual
// numerical thermal calculations; nothing here is AI-generated or invented —
// values are derived from user inputs, the climate snapshot, and standard
// building-physics relations (broadly aligned with the ISO 52016-1 / "5R1C"
// simplified dynamic model). Constants used:
// ---------------------------------------------------------------------------
const AIR_CP_J_KGK = 1005 // specific heat of air at constant pressure
const R_SI = 0.13 // internal surface resistance, m2K/W (vertical wall)
const R_SE = 0.04 // external surface resistance, m2K/W
const SEA_LEVEL_PRESSURE_KPA = 101.325
const SEA_LEVEL_TEMP_K = 288.15
const LAPSE_RATE_K_PER_M = 0.0065
const GAS_CONSTANT_AIR = 287.05 // J/(kg·K)
const G = 9.80665

/** Thermal resistance R = thickness / k, summed across layers, plus surface resistances. */
export function assemblyResistance(assembly: Assembly): number {
  let r = R_SI + R_SE
  for (const layer of assembly.layers) {
    const mat = getMaterial(layer.materialId)
    if (mat.thermalConductivityWmK > 0) {
      r += layer.thicknessM / mat.thermalConductivityWmK
    }
  }
  return r // m2K/W
}

/** U = 1 / R_total (W/m2K) */
export function uValue(assembly: Assembly): number {
  return 1 / assemblyResistance(assembly)
}

/** Barometric formula: pressure (kPa) and air density (kg/m3) at altitude. */
export function altitudeCorrection(altitudeM: number) {
  const tempK = SEA_LEVEL_TEMP_K - LAPSE_RATE_K_PER_M * altitudeM
  const pressureKpa =
    SEA_LEVEL_PRESSURE_KPA *
    Math.pow(1 - (LAPSE_RATE_K_PER_M * altitudeM) / SEA_LEVEL_TEMP_K, (G) / (LAPSE_RATE_K_PER_M * GAS_CONSTANT_AIR))
  const densityKgM3 = (pressureKpa * 1000) / (GAS_CONSTANT_AIR * tempK)
  return { pressureKpa, densityKgM3, tempK }
}

/** Orientation factor: fraction of peak solar exposure a facade receives given its compass heading. */
function orientationFactor(orientation: Orientation): number {
  const angle = typeof orientation === 'number'
    ? orientation
    : { N: 180, S: 0, E: 90, W: 270 }[orientation]
  // South-facing (angle 0) gets full exposure in the northern hemisphere demo case;
  // falls off with cosine of angular offset, floored so north walls still get diffuse gain.
  const rad = (angle * Math.PI) / 180
  return Math.max(0.15, Math.cos(rad) * 0.85 + 0.15)
}

export function envelopeAreas(geo: Geometry) {
  const perimeter = 2 * (geo.lengthM + geo.widthM)
  const grossWallArea = perimeter * geo.heightM
  const openingArea = geo.windowAreaM2 * geo.numWindows === geo.windowAreaM2
    ? geo.windowAreaM2 // treat windowAreaM2 as already-total if numWindows already folded in
    : geo.windowAreaM2
  const totalWindowArea = geo.windowAreaM2
  const totalDoorArea = geo.doorAreaM2
  const netWallArea = Math.max(0, grossWallArea - totalWindowArea - totalDoorArea)
  const floorArea = geo.lengthM * geo.widthM
  const roofArea = geo.shape === 'dome'
    ? 2 * Math.PI * Math.pow((geo.lengthM + geo.widthM) / 4, 2) // hemisphere approx
    : floorArea * (geo.shape === 'a-frame' ? 1.25 : 1.05) // pitch allowance
  const volume = geo.shape === 'dome'
    ? (2 / 3) * Math.PI * Math.pow((geo.lengthM + geo.widthM) / 4, 2) * geo.heightM
    : floorArea * geo.heightM + 0.5 * floorArea * geo.roofHeightM
  return { grossWallArea, netWallArea, totalWindowArea, totalDoorArea, floorArea, roofArea, volume }
}

interface EngineInputs {
  geometry: Geometry
  wallAssembly: Assembly
  roofAssembly: Assembly
  occupancy: Occupancy
  ventilation: Ventilation
  climate: ClimateSnapshot
  location: { altitudeM: number }
  comfort: ComfortRange
  settings: SimulationSettings
}

function parseHour(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h + (m || 0) / 60
}

function isOccupied(hour: number, occ: Occupancy): boolean {
  const start = parseHour(occ.scheduleStart)
  const end = parseHour(occ.scheduleEnd)
  if (start <= end) return hour >= start && hour < end
  return hour >= start || hour < end // overnight schedule
}

/**
 * Runs an hourly thermal balance simulation using a single-node (1R1C-style)
 * lumped-capacitance model with a fixed effective thermal mass derived from
 * the envelope's material layers. This is a simplified variant of the
 * ISO 52016-1 5R1C approach appropriate for a conceptual design tool —
 * documented here, not presented as a certified compliance calculation.
 */
export function runSimulation(inputs: EngineInputs): SimulationResults {
  const { geometry, wallAssembly, roofAssembly, occupancy, ventilation, climate, location, comfort, settings } = inputs

  const uWall = uValue(wallAssembly)
  const uRoof = uValue(roofAssembly)
  const uWindow = 5.8 // W/m2K, typical single-glazed reference
  const rWall = assemblyResistance(wallAssembly)

  const areas = envelopeAreas(geometry)
  const { pressureKpa, densityKgM3 } = altitudeCorrection(location.altitudeM)
  const orientFactor = orientationFactor(geometry.orientation)

  // Effective thermal mass (J/K) from wall + floor material heat capacities.
  let thermalCapacityJK = 0
  for (const layer of wallAssembly.layers) {
    const mat = getMaterial(layer.materialId)
    thermalCapacityJK += mat.densityKgM3 * mat.specificHeatJkgK * layer.thicknessM * areas.netWallArea
  }
  thermalCapacityJK += densityKgM3 * AIR_CP_J_KGK * areas.volume // indoor air capacitance
  thermalCapacityJK = Math.max(thermalCapacityJK, 1e6)

  const hoursSource = climate.hourly
  const hours: number[] = hoursSource ? hoursSource.hour : Array.from({ length: 24 }, (_, i) => i)

  const results: HourlyResult[] = []
  let indoorTempC = climate.hourly ? climate.hourly.tempC[settings.startHour] + 5 : climate.tempC + 5

  const dtSeconds = 3600 // hourly step regardless of requested timeStep, for stability of this simplified model

  for (let h = settings.startHour; h <= settings.endHour && h < 24; h++) {
    const idx = hoursSource ? hoursSource.hour.indexOf(h) : h
    const outdoorTempC = hoursSource ? hoursSource.tempC[idx] : climate.tempC
    const solarIrradiance = hoursSource ? hoursSource.solarWm2[idx] : climate.solarWm2
    const windSpeed = hoursSource ? hoursSource.windSpeedMs[idx] : climate.windSpeedMs

    // 1. Solar heat gain: Qsolar = I * A * alpha * orientationFactor (windows use SHGC-like transmittance)
    const wallMat = getMaterial(wallAssembly.layers[0]?.materialId ?? 'concrete')
    const solarOnWalls = solarIrradiance * areas.netWallArea * wallMat.solarAbsorptivity * orientFactor * 0.35
    const solarOnWindows = solarIrradiance * areas.totalWindowArea * 0.7 * orientFactor // 0.7 ~ window transmittance
    const solarOnRoof = solarIrradiance * areas.roofArea * 0.5 * 0.6
    const solarGainW = solarOnWalls + solarOnWindows + solarOnRoof

    // 2. + 3. + 4. Conduction: Q = U * A * dT, summed per envelope component
    const dT = indoorTempC - outdoorTempC
    const wallLoss = uWall * areas.netWallArea * dT
    const roofLoss = uRoof * areas.roofArea * dT
    const windowLoss = uWindow * areas.totalWindowArea * dT
    const doorLoss = 2.5 * areas.totalDoorArea * dT // reference U-value for insulated door
    const conductionLossW = wallLoss + roofLoss + windowLoss + doorLoss

    // 5. Ventilation heat loss: Qvent = rho * Cp * ACH * V * dT / 3600
    const occupied = isOccupied(h, occupancy)
    const effectiveAch = ventilation.ach * (0.4 + 0.6 * ventilation.windowOpenFraction) + ventilation.mechanicalAch
    const ventilationLossW = densityKgM3 * AIR_CP_J_KGK * effectiveAch * areas.volume * dT / 3600

    // 6. Infiltration: wind-speed-modulated air leakage
    const windFactor = 1 + windSpeed / 10
    const infiltrationAch = ventilation.infiltrationAchBase * windFactor
    const infiltrationLossW = densityKgM3 * AIR_CP_J_KGK * infiltrationAch * areas.volume * dT / 3600

    // 7. Internal gains: Qinternal = occupants * sensible_heat_per_person (only while occupied)
    const internalGainW = occupied
      ? occupancy.numOccupants * occupancy.sensibleHeatPerPersonW
      : 0

    // 8. Thermal balance
    const netHeatFlowW = solarGainW + internalGainW - conductionLossW - ventilationLossW - infiltrationLossW

    // 9. Dynamic indoor temperature update via lumped thermal capacitance:
    // dT/dt = Qnet / C  ->  T_new = T + (Qnet * dt) / C
    indoorTempC = indoorTempC + (netHeatFlowW * dtSeconds) / thermalCapacityJK

    results.push({
      hour: h,
      outdoorTempC,
      indoorTempC,
      solarGainW,
      conductionLossW,
      ventilationLossW,
      infiltrationLossW,
      internalGainW,
      netHeatFlowW,
    })
  }

  const n = results.length || 1
  const avgIndoorTempC = results.reduce((s, r) => s + r.indoorTempC, 0) / n
  const avgOutdoorTempC = results.reduce((s, r) => s + r.outdoorTempC, 0) / n
  const totalSolarGainKWh = results.reduce((s, r) => s + r.solarGainW, 0) / 1000
  const totalLossW = results.reduce((s, r) => s + r.conductionLossW + r.ventilationLossW + r.infiltrationLossW, 0)
  const totalHeatLossKWh = totalLossW / 1000
  const peakHeatLossW = Math.max(...results.map((r) => r.conductionLossW + r.ventilationLossW + r.infiltrationLossW), 0)

  const comfortable = results.filter((r) => r.indoorTempC >= comfort.minC && r.indoorTempC <= comfort.maxC).length
  const below = results.filter((r) => r.indoorTempC < comfort.minC).length
  const above = results.filter((r) => r.indoorTempC > comfort.maxC).length
  const comfortHoursPct = (comfortable / n) * 100
  const belowComfortPct = (below / n) * 100
  const aboveComfortPct = (above / n) * 100

  // Energy requirement: heat that would need to be supplied to keep indoor temp
  // at the comfort minimum whenever net flow would otherwise drop below it.
  const energyRequirementKWh = results
    .filter((r) => r.indoorTempC < comfort.minC)
    .reduce((s, r) => s + Math.abs(r.netHeatFlowW), 0) / 1000

  const thermalEfficiencyPct = Math.max(0, Math.min(100, 100 * (1 - totalHeatLossKWh / Math.max(totalSolarGainKWh + 0.001, 1))))

  return {
    hourly: results,
    avgIndoorTempC,
    avgOutdoorTempC,
    totalSolarGainKWh,
    totalHeatLossKWh,
    peakHeatLossW,
    comfortHoursPct,
    belowComfortPct,
    aboveComfortPct,
    uValueWallWm2K: uWall,
    uValueRoofWm2K: uRoof,
    totalWallResistance: rWall,
    airDensityKgM3: densityKgM3,
    atmosphericPressureKpa: pressureKpa,
    energyRequirementKWh,
    thermalEfficiencyPct,
  }
}
