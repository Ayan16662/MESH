export type ShelterShape = 'rectangular' | 'square' | 'a-frame' | 'dome'
export type Orientation = 'N' | 'S' | 'E' | 'W' | number // number = custom angle deg from north

export interface MaterialLayer {
  materialId: string
  thicknessM: number
}

export interface Assembly {
  name: string
  layers: MaterialLayer[] // ordered outside -> inside
}

export interface Geometry {
  lengthM: number
  widthM: number
  heightM: number
  roofHeightM: number
  shape: ShelterShape
  wallThicknessM: number
  floorThicknessM: number
  orientation: Orientation
  windowAreaM2: number
  doorAreaM2: number
  numWindows: number
  numDoors: number
}

export interface Location {
  name: string
  lat: number
  lng: number
  altitudeM: number
  region?: string
  country?: string
}

export interface ClimateSnapshot {
  source: 'live' | 'demo'
  tempC: number
  humidityPct: number
  windSpeedMs: number
  windDirDeg: number
  solarWm2: number
  cloudCoverPct: number
  pressureHpa: number
  precipMm: number
  hourly?: HourlyClimate
}

export interface HourlyClimate {
  hour: number[] // 0-23
  tempC: number[]
  solarWm2: number[]
  windSpeedMs: number[]
  humidityPct: number[]
  cloudCoverPct: number[]
}

export interface Occupancy {
  numOccupants: number
  scheduleStart: string // "06:00"
  scheduleEnd: string // "22:00"
  activityLevel: 'resting' | 'light' | 'moderate' | 'heavy'
  sensibleHeatPerPersonW: number
  latentHeatPerPersonW: number
}

export interface Ventilation {
  ach: number // air changes per hour, natural
  mechanicalAch: number
  windowOpenFraction: number // 0-1
  infiltrationAchBase: number
}

export interface ComfortRange {
  minC: number
  maxC: number
}

export interface SimulationSettings {
  date: string // ISO date
  startHour: number
  endHour: number
  timeStepMin: number
}

export interface HourlyResult {
  hour: number
  outdoorTempC: number
  indoorTempC: number
  solarGainW: number
  conductionLossW: number
  ventilationLossW: number
  infiltrationLossW: number
  internalGainW: number
  netHeatFlowW: number
}

export interface SimulationResults {
  hourly: HourlyResult[]
  avgIndoorTempC: number
  avgOutdoorTempC: number
  totalSolarGainKWh: number
  totalHeatLossKWh: number
  peakHeatLossW: number
  comfortHoursPct: number
  belowComfortPct: number
  aboveComfortPct: number
  uValueWallWm2K: number
  uValueRoofWm2K: number
  totalWallResistance: number
  airDensityKgM3: number
  atmosphericPressureKpa: number
  energyRequirementKWh: number
  thermalEfficiencyPct: number
}

export interface ShelterProject {
  id: string
  name: string
  description: string
  designer: string
  organization: string
  shelterType: string
  location: Location
  climate: ClimateSnapshot
  geometry: Geometry
  wallAssembly: Assembly
  roofAssembly: Assembly
  occupancy: Occupancy
  ventilation: Ventilation
  comfort: ComfortRange
  simulationSettings: SimulationSettings
  results?: SimulationResults
  createdAt: string
  updatedAt: string
}
