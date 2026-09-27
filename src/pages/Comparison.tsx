import { useMemo, useState } from 'react'
import { useProject } from '../store/ProjectContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Comparison() {
  const { projects } = useProject()
  const simulated = projects.filter((p) => p.results)
  const [selected, setSelected] = useState<string[]>(simulated.slice(0, 3).map((p) => p.id))

  const chosen = simulated.filter((p) => selected.includes(p.id))

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 4 ? [...s, id] : s))
  }

  const barData = useMemo(
    () =>
      chosen.map((p) => ({
        name: p.name.length > 16 ? p.name.slice(0, 16) + '…' : p.name,
        'Indoor Temp (°C)': Number(p.results!.avgIndoorTempC.toFixed(1)),
        'Heat Loss (kWh)': Number(p.results!.totalHeatLossKWh.toFixed(1)),
        'Solar Gain (kWh)': Number(p.results!.totalSolarGainKWh.toFixed(1)),
        'Comfort Hours (%)': Number(p.results!.comfortHoursPct.toFixed(0)),
      })),
    [chosen],
  )

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="font-display font-700 text-2xl mb-1">Design Comparison</h1>
      <p className="text-sm text-slate mb-6">Select up to 4 simulated projects to compare side by side.</p>

      {simulated.length === 0 ? (
        <div className="border border-dashed border-line rounded-lg p-10 text-center text-slate">
          No simulated projects yet. Run a simulation and save the project first.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {simulated.map((p) => (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  selected.includes(p.id) ? 'border-ice/50 text-ice2 bg-ice/10' : 'border-line text-slate hover:text-frost'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {chosen.length > 0 && (
            <>
              <div className="overflow-x-auto border border-line rounded-md mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-slate text-xs uppercase">
                      <th className="px-4 py-3">Design</th>
                      <th className="px-4 py-3">Wall Assembly</th>
                      <th className="px-4 py-3 data-num">Indoor °C</th>
                      <th className="px-4 py-3 data-num">Heat Loss kWh</th>
                      <th className="px-4 py-3 data-num">Solar Gain kWh</th>
                      <th className="px-4 py-3 data-num">Wall U</th>
                      <th className="px-4 py-3 data-num">Comfort %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chosen.map((p) => (
                      <tr key={p.id} className="border-b border-line/50">
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3 text-slate text-xs">{p.wallAssembly.name}</td>
                        <td className="px-4 py-3 data-num text-ice2">{p.results!.avgIndoorTempC.toFixed(1)}</td>
                        <td className="px-4 py-3 data-num text-ember2">{p.results!.totalHeatLossKWh.toFixed(1)}</td>
                        <td className="px-4 py-3 data-num">{p.results!.totalSolarGainKWh.toFixed(1)}</td>
                        <td className="px-4 py-3 data-num">{p.results!.uValueWallWm2K.toFixed(2)}</td>
                        <td className="px-4 py-3 data-num">{p.results!.comfortHoursPct.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border border-line rounded-md bg-panel p-4 mb-4">
                <div className="font-display font-600 text-sm mb-2">Comfort Hours vs Heat Loss</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData}>
                    <CartesianGrid stroke="#1E2A3D" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#7C8AA3" fontSize={11} />
                    <YAxis stroke="#7C8AA3" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#111A28', border: '1px solid #1E2A3D', borderRadius: 6, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Heat Loss (kWh)" fill="#F2733B" />
                    <Bar dataKey="Solar Gain (kWh)" fill="#F5D742" />
                    <Bar dataKey="Comfort Hours (%)" fill="#4FD1E8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-slate leading-relaxed">
                Each design performs differently based on its material assembly and climate exposure — a lower
                heat loss does not automatically mean the better design once cost, thickness, and buildability
                at the target site are weighed in. Review the envelope and material choices above alongside
                these results rather than reading one number in isolation.
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}
