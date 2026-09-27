export type MaterialCategory = 'standard' | 'insulation' | 'drdo_military' | 'pcm' | 'radiant'

export interface Material {
  id: string
  name: string
  category?: MaterialCategory
  description?: string
  densityKgM3: number
  thermalConductivityWmK: number // k (W/mK)
  specificHeatJkgK: number
  solarAbsorptivity: number // 0-1
  emissivity: number // 0-1
  costPerM3Inr: number
  latentHeatJkg?: number // For PCM materials
  phaseChangeTempC?: number // For PCM materials
}

// Extended Reference & DRDO / Military Grade Thermal Materials Catalog
// Sources: DRDO Defense Terrain & Climate Research Standards, ISO 10456, ASHRAE Fundamentals.
export const MATERIALS: Material[] = [
  // --- DRDO & MILITARY ADVANCED INSULATION MATERIALS ---
  {
    id: 'aerogel',
    name: 'DRDO Silica Aerogel Blanket (Nanoporous)',
    category: 'drdo_military',
    description: 'Ultra-low thermal conductivity nanoporous aerogel blanket designed for Siachen & Dras extreme altitude sub-zero shelters.',
    densityKgM3: 130,
    thermalConductivityWmK: 0.014,
    specificHeatJkgK: 1000,
    solarAbsorptivity: 0.25,
    emissivity: 0.88,
    costPerM3Inr: 85000,
  },
  {
    id: 'vip_panel',
    name: 'Fumed Silica Vacuum Insulation Panel (VIP)',
    category: 'drdo_military',
    description: 'Evacuated core panel delivering maximum R-value in minimal thickness for rapid-deploy modular military shelters.',
    densityKgM3: 180,
    thermalConductivityWmK: 0.004,
    specificHeatJkgK: 800,
    solarAbsorptivity: 0.3,
    emissivity: 0.85,
    costPerM3Inr: 145000,
  },
  {
    id: 'pcm_tile',
    name: 'Paraffin Bio-PCM Thermal Tile (21°C Transition)',
    category: 'pcm',
    description: 'Phase-change material tile storing latent thermal energy during day and releasing heat at night for passive comfort.',
    densityKgM3: 850,
    thermalConductivityWmK: 0.15,
    specificHeatJkgK: 2100,
    solarAbsorptivity: 0.4,
    emissivity: 0.9,
    costPerM3Inr: 48000,
    latentHeatJkg: 195000,
    phaseChangeTempC: 21,
  },
  {
    id: 'graphite_eps',
    name: 'DRDO Neopor Graphite-Enhanced EPS',
    category: 'drdo_military',
    description: 'IR-absorbent graphite particle infused expanded polystyrene for high-altitude thermal retention.',
    densityKgM3: 28,
    thermalConductivityWmK: 0.030,
    specificHeatJkgK: 1450,
    solarAbsorptivity: 0.5,
    emissivity: 0.65,
    costPerM3Inr: 8900,
  },
  {
    id: 'drdo_puf',
    name: 'DRDO High-Density Rigid PUF Core Panel',
    category: 'drdo_military',
    description: 'Flame-retardant closed-cell polyurethane foam core engineered for high-altitude weather-tight shelter assemblies.',
    densityKgM3: 42,
    thermalConductivityWmK: 0.019,
    specificHeatJkgK: 1400,
    solarAbsorptivity: 0.35,
    emissivity: 0.5,
    costPerM3Inr: 18500,
  },
  {
    id: 'mli_blanket',
    name: 'Aluminized Multi-Layer Insulation (MLI)',
    category: 'radiant',
    description: 'Low-emissivity radiant barrier foil sandwich for intense solar radiation rejection in high-altitude/desert environments.',
    densityKgM3: 15,
    thermalConductivityWmK: 0.008,
    specificHeatJkgK: 900,
    solarAbsorptivity: 0.12,
    emissivity: 0.03,
    costPerM3Inr: 32000,
  },
  {
    id: 'xlpe_foam',
    name: 'Cross-Linked Polyethylene (XLPE Closed-Cell)',
    category: 'insulation',
    description: 'Moisture-impermeable frost ground insulation preventing permafrost cold transfer through shelter flooring.',
    densityKgM3: 35,
    thermalConductivityWmK: 0.032,
    specificHeatJkgK: 1500,
    solarAbsorptivity: 0.4,
    emissivity: 0.8,
    costPerM3Inr: 9200,
  },
  {
    id: 'mud_straw',
    name: 'Himalayan Mud-Straw Heavy Composite',
    category: 'standard',
    description: 'Traditional high-thermal mass local earthen composite providing natural thermal damping.',
    densityKgM3: 1650,
    thermalConductivityWmK: 0.58,
    specificHeatJkgK: 1800,
    solarAbsorptivity: 0.68,
    emissivity: 0.92,
    costPerM3Inr: 2200,
  },
  {
    id: 'radiant_foil',
    name: 'Reflective Low-E Aluminium Barrier Foil',
    category: 'radiant',
    description: 'High-reflectivity radiant barrier layer eliminating radiative surface thermal loss.',
    densityKgM3: 8,
    thermalConductivityWmK: 0.040,
    specificHeatJkgK: 900,
    solarAbsorptivity: 0.08,
    emissivity: 0.04,
    costPerM3Inr: 6500,
  },

  // --- STANDARD STRUCTURAL & INSULATION MATERIALS ---
  { id: 'concrete', name: 'Concrete (dense)', category: 'standard', densityKgM3: 2300, thermalConductivityWmK: 1.7, specificHeatJkgK: 880, solarAbsorptivity: 0.65, emissivity: 0.9, costPerM3Inr: 6500 },
  { id: 'brick', name: 'Brick (common)', category: 'standard', densityKgM3: 1700, thermalConductivityWmK: 0.72, specificHeatJkgK: 840, solarAbsorptivity: 0.6, emissivity: 0.9, costPerM3Inr: 4200 },
  { id: 'stone', name: 'Stone (local, dry-set)', category: 'standard', densityKgM3: 2600, thermalConductivityWmK: 2.2, specificHeatJkgK: 800, solarAbsorptivity: 0.55, emissivity: 0.9, costPerM3Inr: 3800 },
  { id: 'wood', name: 'Timber (softwood)', category: 'standard', densityKgM3: 500, thermalConductivityWmK: 0.13, specificHeatJkgK: 1600, solarAbsorptivity: 0.5, emissivity: 0.9, costPerM3Inr: 9500 },
  { id: 'steel', name: 'Steel sheet', category: 'standard', densityKgM3: 7850, thermalConductivityWmK: 50, specificHeatJkgK: 450, solarAbsorptivity: 0.6, emissivity: 0.3, costPerM3Inr: 62000 },
  { id: 'aluminium', name: 'Aluminium sheet', category: 'standard', densityKgM3: 2700, thermalConductivityWmK: 205, specificHeatJkgK: 900, solarAbsorptivity: 0.3, emissivity: 0.1, costPerM3Inr: 210000 },
  { id: 'glass', name: 'Glass (single pane)', category: 'standard', densityKgM3: 2500, thermalConductivityWmK: 1.0, specificHeatJkgK: 840, solarAbsorptivity: 0.06, emissivity: 0.84, costPerM3Inr: 45000 },
  { id: 'eps', name: 'EPS insulation', category: 'insulation', densityKgM3: 20, thermalConductivityWmK: 0.036, specificHeatJkgK: 1450, solarAbsorptivity: 0.5, emissivity: 0.6, costPerM3Inr: 5200 },
  { id: 'xps', name: 'XPS insulation', category: 'insulation', densityKgM3: 35, thermalConductivityWmK: 0.029, specificHeatJkgK: 1450, solarAbsorptivity: 0.5, emissivity: 0.6, costPerM3Inr: 7800 },
  { id: 'rockwool', name: 'Rock wool', category: 'insulation', densityKgM3: 100, thermalConductivityWmK: 0.038, specificHeatJkgK: 840, solarAbsorptivity: 0.5, emissivity: 0.85, costPerM3Inr: 6900 },
  { id: 'pur', name: 'Polyurethane foam', category: 'insulation', densityKgM3: 32, thermalConductivityWmK: 0.023, specificHeatJkgK: 1400, solarAbsorptivity: 0.5, emissivity: 0.6, costPerM3Inr: 9800 },
  { id: 'compositepanel', name: 'Composite sandwich panel', category: 'insulation', densityKgM3: 45, thermalConductivityWmK: 0.021, specificHeatJkgK: 1200, solarAbsorptivity: 0.45, emissivity: 0.55, costPerM3Inr: 14500 },
  { id: 'insulatedpanel', name: 'Insulated metal panel (PUF core)', category: 'insulation', densityKgM3: 38, thermalConductivityWmK: 0.022, specificHeatJkgK: 1300, solarAbsorptivity: 0.4, emissivity: 0.4, costPerM3Inr: 16800 },
  { id: 'airgap', name: 'Air gap (unventilated, 20-100mm)', category: 'standard', densityKgM3: 1.2, thermalConductivityWmK: 0.18, specificHeatJkgK: 1005, solarAbsorptivity: 0, emissivity: 0, costPerM3Inr: 0 },
]

export function getMaterial(id: string): Material {
  const m = MATERIALS.find((m) => m.id === id)
  if (!m) {
    return { id, name: id, densityKgM3: 1000, thermalConductivityWmK: 0.1, specificHeatJkgK: 1000, solarAbsorptivity: 0.5, emissivity: 0.9, costPerM3Inr: 5000 }
  }
  return m
}
