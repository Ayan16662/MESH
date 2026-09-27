import { useState } from 'react'
import type { Geometry } from '../types'

export default function Shelter2D({ geometry }: { geometry: Geometry }) {
  const [zoom, setZoom] = useState(1)
  const pad = 60
  const scale = 40 * zoom // px per meter
  const w = geometry.lengthM * scale
  const h = geometry.widthM * scale
  const viewW = w + pad * 2
  const viewH = h + pad * 2

  const wallPx = Math.max(4, geometry.wallThicknessM * scale)
  const windowW = Math.min(w * 0.3, Math.sqrt(geometry.windowAreaM2) * scale)
  const doorW = Math.min(w * 0.25, geometry.doorAreaM2 / 2.1 * scale)

  const orientLabel = typeof geometry.orientation === 'number' ? `${geometry.orientation}°` : geometry.orientation

  return (
    <div className="border border-line bg-panel2 rounded-md p-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-xs text-slate">Floor Plan — engineering view</div>
        <div className="flex gap-1.5">
          <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))} className="px-2 py-0.5 text-xs border border-line rounded hover:bg-panel text-slate">−</button>
          <button onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))} className="px-2 py-0.5 text-xs border border-line rounded hover:bg-panel text-slate">+</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${viewW} ${viewH}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
        <defs>
          <pattern id="grid2d" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E2A3D" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={viewW} height={viewH} fill="url(#grid2d)" />

        {/* North arrow */}
        <g transform={`translate(${viewW - 34}, 24)`}>
          <line x1="0" y1="14" x2="0" y2="-10" stroke="#4FD1E8" strokeWidth="1.5" />
          <polygon points="0,-14 -4,-6 4,-6" fill="#4FD1E8" />
          <text x="0" y="26" textAnchor="middle" fontSize="10" fill="#7C8AA3">N</text>
        </g>

        {/* Outer wall */}
        <rect x={pad} y={pad} width={w} height={h} fill="none" stroke="#E8EDF4" strokeWidth={wallPx} />
        {/* Interior fill */}
        <rect x={pad + wallPx / 2} y={pad + wallPx / 2} width={w - wallPx} height={h - wallPx} fill="#0D1622" />

        {/* Door (bottom wall) */}
        <rect x={pad + w * 0.1} y={pad + h - wallPx / 2} width={doorW} height={wallPx} fill="#F2733B" />
        <text x={pad + w * 0.1 + doorW / 2} y={pad + h + 16} textAnchor="middle" fontSize="10" fill="#F5966A">DOOR</text>

        {/* Windows (top wall) */}
        {Array.from({ length: Math.max(1, geometry.numWindows) }).map((_, i) => {
          const spacing = w / (geometry.numWindows + 1)
          const x = pad + spacing * (i + 1) - windowW / 2
          return (
            <g key={i}>
              <rect x={x} y={pad - wallPx / 2} width={windowW} height={wallPx} fill="#4FD1E8" />
            </g>
          )
        })}
        <text x={pad + w / 2} y={pad - 14} textAnchor="middle" fontSize="10" fill="#7FE3F0">WINDOW{geometry.numWindows > 1 ? 'S' : ''}</text>

        {/* Room label */}
        <text x={pad + w / 2} y={pad + h / 2} textAnchor="middle" fontSize="12" fill="#7C8AA3" fontFamily="monospace">
          ROOM · {geometry.shape.toUpperCase()}
        </text>
        <text x={pad + w / 2} y={pad + h / 2 + 16} textAnchor="middle" fontSize="10" fill="#4FD1E8" fontFamily="monospace">
          orientation {orientLabel}
        </text>

        {/* Dimension: length (top) */}
        <line x1={pad} y1={pad - 30} x2={pad + w} y2={pad - 30} stroke="#7C8AA3" strokeWidth="1" />
        <text x={pad + w / 2} y={pad - 34} textAnchor="middle" fontSize="10" fill="#7C8AA3" fontFamily="monospace">
          {geometry.lengthM.toFixed(1)} m
        </text>

        {/* Dimension: width (left) */}
        <line x1={pad - 30} y1={pad} x2={pad - 30} y2={pad + h} stroke="#7C8AA3" strokeWidth="1" />
        <text x={pad - 34} y={pad + h / 2} textAnchor="middle" fontSize="10" fill="#7C8AA3" fontFamily="monospace" transform={`rotate(-90 ${pad - 34} ${pad + h / 2})`}>
          {geometry.widthM.toFixed(1)} m
        </text>
      </svg>
    </div>
  )
}
