import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProject } from '../store/ProjectContext'
import { generateAnalysis } from '../lib/aiAnalysis'
import { Download, Loader2, Printer } from 'lucide-react'

export default function Report() {
  const { project } = useProject()
  const [analysis, setAnalysis] = useState<{ text: string; source: 'ai' | 'rule-based' } | null>(null)
  const [loading, setLoading] = useState(false)

  const r = project.results

  async function runAnalysis() {
    if (!r) return
    setLoading(true)
    const result = await generateAnalysis(project)
    setAnalysis(result)
    setLoading(false)
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `${slug(project.name)}.json`)
  }

  function exportCsv() {
    if (!r) return
    const header = 'hour,outdoorTempC,indoorTempC,solarGainW,conductionLossW,ventilationLossW,infiltrationLossW,internalGainW,netHeatFlowW'
    const rows = r.hourly.map((h) =>
      [h.hour, h.outdoorTempC, h.indoorTempC, h.solarGainW, h.conductionLossW, h.ventilationLossW, h.infiltrationLossW, h.internalGainW, h.netHeatFlowW]
        .map((v) => Number(v).toFixed(2)).join(','),
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    downloadBlob(blob, `${slug(project.name)}_hourly.csv`)
  }

  if (!r) {
    return (
      <div className="p-8 max-w-4xl">
        <h1 className="font-display font-700 text-2xl mb-3">Engineering Report</h1>
        <div className="border border-dashed border-line rounded-lg p-10 text-center text-slate">
          No results yet. <Link to="/simulation" className="text-ice2 underline">Run a simulation first</Link>.
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="font-display font-700 text-2xl">Engineering Report</h1>
        <div className="flex gap-2">
          <button onClick={exportJson} className="flex items-center gap-1.5 text-sm border border-line px-3 py-2 rounded-md hover:border-ice/40"><Download size={14} /> JSON</button>
          <button onClick={exportCsv} className="flex items-center gap-1.5 text-sm border border-line px-3 py-2 rounded-md hover:border-ice/40"><Download size={14} /> CSV</button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm border border-line px-3 py-2 rounded-md hover:border-ice/40"><Printer size={14} /> Print / PDF</button>
        </div>
      </div>

      <div className="border border-line rounded-lg bg-panel p-8 print:border-0 print:bg-white print:text-black">
        <div className="mb-6">
          <div className="text-[11px] text-slate tracking-wide">THERMA ENGINEERING REPORT</div>
          <h2 className="font-display font-700 text-xl mt-1">{project.name}</h2>
          <div className="text-sm text-slate mt-1">{project.shelterType} · {project.designer || 'Unnamed designer'} {project.organization && `· ${project.organization}`}</div>
        </div>

        <ReportSection title="Location">
          {project.location.name} — lat {project.location.lat.toFixed(4)}, lng {project.location.lng.toFixed(4)}, altitude {project.location.altitudeM.toFixed(0)} m
        </ReportSection>

        <ReportSection title="Climate Conditions">
          Source: {project.climate.source === 'live' ? 'live API fetch' : 'DEMO DATA (offline fallback)'}. Outdoor temp {project.climate.tempC.toFixed(1)}°C,
          humidity {project.climate.humidityPct.toFixed(0)}%, wind {project.climate.windSpeedMs.toFixed(1)} m/s, solar {project.climate.solarWm2.toFixed(0)} W/m².
        </ReportSection>

        <ReportSection title="Shelter Configuration">
          {project.geometry.lengthM}m × {project.geometry.widthM}m × {project.geometry.heightM}m, {project.geometry.shape} shape,
          orientation {String(project.geometry.orientation)}, {project.geometry.numWindows} window(s), {project.geometry.numDoors} door(s).
        </ReportSection>

        <ReportSection title="Material Configuration">
          Wall: {project.wallAssembly.name} (U = {r.uValueWallWm2K.toFixed(3)} W/m²K, R = {r.totalWallResistance.toFixed(2)} m²K/W). Roof: {project.roofAssembly.name} (U = {r.uValueRoofWm2K.toFixed(3)} W/m²K).
        </ReportSection>

        <ReportSection title="Occupancy & Ventilation">
          {project.occupancy.numOccupants} occupants, {project.occupancy.scheduleStart}–{project.occupancy.scheduleEnd}, {project.occupancy.activityLevel} activity.
          Ventilation: {project.ventilation.ach} ACH natural + {project.ventilation.mechanicalAch} ACH mechanical, infiltration base {project.ventilation.infiltrationAchBase} ACH.
        </ReportSection>

        <ReportSection title="Thermal Results">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 data-num text-sm">
            <div>Avg indoor temp: {r.avgIndoorTempC.toFixed(1)} °C</div>
            <div>Avg outdoor temp: {r.avgOutdoorTempC.toFixed(1)} °C</div>
            <div>Total solar gain: {r.totalSolarGainKWh.toFixed(1)} kWh</div>
            <div>Total heat loss: {r.totalHeatLossKWh.toFixed(1)} kWh</div>
            <div>Peak heat loss: {r.peakHeatLossW.toFixed(0)} W</div>
            <div>Comfort hours: {r.comfortHoursPct.toFixed(0)}%</div>
            <div>Air density (altitude-corrected): {r.airDensityKgM3.toFixed(3)} kg/m³</div>
            <div>Estimated energy required: {r.energyRequirementKWh.toFixed(1)} kWh</div>
          </div>
        </ReportSection>

        <ReportSection title="AI Engineering Analysis">
          {!analysis ? (
            <button onClick={runAnalysis} disabled={loading} className="print:hidden flex items-center gap-1.5 text-sm border border-ice/40 text-ice2 px-3 py-2 rounded-md hover:bg-ice/10">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {loading ? 'Generating…' : 'Generate Analysis'}
            </button>
          ) : (
            <div>
              <div className="text-[10px] text-slate mb-2 uppercase">{analysis.source === 'ai' ? 'LLM-generated, grounded in results above' : 'Rule-based summary (no external AI configured)'}</div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-frost print:text-black">{analysis.text}</pre>
            </div>
          )}
        </ReportSection>

        <ReportSection title="Assumptions & Limitations">
          Simplified single-node (lumped-capacitance) hourly thermal model, not a certified ISO 52016 compliance calculation.
          Window and door U-values use standard reference constants. Material properties are reference/demo values, not
          site-tested. ANSYS Validation: Pending.
        </ReportSection>
      </div>
    </div>
  )
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-xs uppercase tracking-wide text-ice2 print:text-black mb-1.5">{title}</div>
      <div className="text-sm text-frost print:text-black leading-relaxed">{children}</div>
    </div>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'therma-project'
}
