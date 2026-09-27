import axios from 'axios'
import type { ShelterProject } from '../types'

// IMPORTANT: this module never invents numbers. It either (a) calls an
// OpenAI-compatible chat endpoint, feeding it the already-computed
// simulation results and instructing it to reference them, or (b) falls
// back to a deterministic, template-based summary built directly from the
// same numbers. Either path only narrates results the physics engine
// (src/lib/physics.ts) already produced.

const API_BASE = import.meta.env.VITE_AI_API_BASE
const API_KEY = import.meta.env.VITE_AI_API_KEY
const MODEL = import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini'

function buildPrompt(p: ShelterProject): string {
  const r = p.results!
  return `You are a building-physics engineer writing a concise design-review memo.
Use ONLY the numbers given below — never invent or adjust any figure.

Project: ${p.name} (${p.shelterType}) at ${p.location.name}, altitude ${p.location.altitudeM} m
Climate source: ${p.climate.source}. Outdoor temp used: ${r.avgOutdoorTempC.toFixed(1)} C avg.
Wall U-value: ${r.uValueWallWm2K.toFixed(2)} W/m2K, Roof U-value: ${r.uValueRoofWm2K.toFixed(2)} W/m2K.
Avg indoor temp: ${r.avgIndoorTempC.toFixed(1)} C. Comfort band: ${p.comfort.minC}-${p.comfort.maxC} C.
Comfort hours: ${r.comfortHoursPct.toFixed(0)}%, below comfort: ${r.belowComfortPct.toFixed(0)}%, above: ${r.aboveComfortPct.toFixed(0)}%.
Total solar gain: ${r.totalSolarGainKWh.toFixed(1)} kWh. Total heat loss: ${r.totalHeatLossKWh.toFixed(1)} kWh.
Peak heat loss: ${r.peakHeatLossW.toFixed(0)} W. Estimated heating energy required: ${r.energyRequirementKWh.toFixed(1)} kWh.
Occupants: ${p.occupancy.numOccupants}. Ventilation ACH: ${p.ventilation.ach}.

Write sections: Executive Summary, Climate Analysis, Heat Loss Analysis, Solar Gain Analysis,
Ventilation Analysis, Design Trade-offs, Potential Improvements, Assumptions & Limitations.
Keep it under 400 words total, reference the numbers above explicitly, plain text (no markdown headers, use "SECTION:" labels).`
}

export async function generateAnalysis(project: ShelterProject): Promise<{ text: string; source: 'ai' | 'rule-based' }> {
  if (API_BASE && API_KEY) {
    try {
      const { data } = await axios.post(
        `${API_BASE.replace(/\/$/, '')}/chat/completions`,
        { model: MODEL, messages: [{ role: 'user', content: buildPrompt(project) }], max_tokens: 900 },
        { headers: { Authorization: `Bearer ${API_KEY}` }, timeout: 20000 },
      )
      const text = data.choices?.[0]?.message?.content
      if (text) return { text, source: 'ai' }
    } catch {
      // fall through to rule-based
    }
  }
  return { text: ruleBasedAnalysis(project), source: 'rule-based' }
}

function ruleBasedAnalysis(p: ShelterProject): string {
  const r = p.results!
  const wallGrade = r.uValueWallWm2K < 0.3 ? 'excellent' : r.uValueWallWm2K < 0.6 ? 'good' : r.uValueWallWm2K < 1.0 ? 'moderate' : 'poor'
  const comfortGrade = r.comfortHoursPct > 75 ? 'well within' : r.comfortHoursPct > 40 ? 'partially within' : 'largely outside'
  const dominant = r.totalHeatLossKWh > r.totalSolarGainKWh ? 'heat loss exceeds solar gain, so passive solar alone cannot maintain comfort' : 'solar gain offsets a substantial share of envelope losses'

  return `SECTION: Executive Summary
${p.name} at ${p.location.name} (altitude ${p.location.altitudeM} m) simulated over ${r.hourly.length} hours reaches an average indoor temperature of ${r.avgIndoorTempC.toFixed(1)} C against an average outdoor temperature of ${r.avgOutdoorTempC.toFixed(1)} C. The shelter spends ${r.comfortHoursPct.toFixed(0)}% of the simulated period ${comfortGrade} the ${p.comfort.minC}-${p.comfort.maxC} C comfort band.

SECTION: Climate Analysis
Climate data source: ${p.climate.source === 'live' ? 'live API fetch' : 'demo dataset (offline fallback)'}. At this altitude, air density is corrected to ${r.airDensityKgM3.toFixed(3)} kg/m3 and atmospheric pressure to ${r.atmosphericPressureKpa.toFixed(1)} kPa, both of which reduce convective and infiltration heat transfer relative to sea level.

SECTION: Heat Loss Analysis
The wall assembly achieves a U-value of ${r.uValueWallWm2K.toFixed(2)} W/m2K (${wallGrade} for this climate) and the roof ${r.uValueRoofWm2K.toFixed(2)} W/m2K. Total simulated heat loss is ${r.totalHeatLossKWh.toFixed(1)} kWh with a peak instantaneous loss of ${r.peakHeatLossW.toFixed(0)} W.

SECTION: Solar Gain Analysis
Total solar gain over the period is ${r.totalSolarGainKWh.toFixed(1)} kWh. Given the recorded losses, ${dominant}.

SECTION: Ventilation Analysis
Natural ventilation is set at ${p.ventilation.ach} ACH with ${(p.ventilation.windowOpenFraction * 100).toFixed(0)}% window opening, plus ${p.ventilation.mechanicalAch} ACH mechanical. Infiltration is modeled with wind-speed modulation on a base rate of ${p.ventilation.infiltrationAchBase} ACH.

SECTION: Design Trade-offs
Reducing U-values further (thicker or higher-performance insulation) reduces conduction loss but adds cost, thickness, and weight — relevant where transport to site is constrained. Larger window area increases solar gain during daylight but raises conduction and radiative loss overnight.

SECTION: Potential Improvements
Candidates worth testing as alternate designs: increasing insulation thickness on the roof (typically the largest single loss path), reducing infiltration through tighter door/window seals, and shifting window area toward the highest-solar-exposure orientation.

SECTION: Assumptions & Limitations
This is a simplified single-node (lumped-capacitance) hourly model, not a certified ISO 52016 compliance calculation. Window transmittance, door U-value, and roof pitch allowances use standard reference constants rather than site-measured values. Estimated heating energy requirement: ${r.energyRequirementKWh.toFixed(1)} kWh for the simulated period. ANSYS Validation: Pending.`
}
