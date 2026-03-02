import type { PillarStat } from '../types'

interface Props {
  pillarAverages: PillarStat[]
}

const CX = 220
const CY = 195
const MAX_R = 130
const LABEL_R = MAX_R + 32

const SHORT_LABELS: Record<string, string> = {
  '1.0': 'Negocios',
  '2.0': 'Procesos',
  '3.0': 'Equipos',
  '4.0': 'Liderazgo',
  '5.0': 'Trabajo',
}

function toPoint(angle_deg: number, r: number) {
  const rad = (angle_deg * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function toPolygonPoints(pillarAverages: PillarStat[], r_factor: number) {
  return pillarAverages
    .map((p, i) => {
      const r = (r_factor > 0 ? r_factor : (p.average / 100)) * MAX_R
      const { x, y } = toPoint(-90 + i * 72, r)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export function RadarChart({ pillarAverages }: Props) {
  const bgPoints = toPolygonPoints(pillarAverages, 1)
  const scorePoints = toPolygonPoints(pillarAverages, 0)

  const gridLevels = [0.25, 0.5, 0.75]

  const labels = pillarAverages.map((p, i) => {
    const angle_deg = -90 + i * 72
    const { x, y } = toPoint(angle_deg, LABEL_R)
    const anchor: 'start' | 'end' | 'middle' = x > CX + 8 ? 'start' : x < CX - 8 ? 'end' : 'middle'
    const baseline: 'auto' | 'hanging' | 'middle' = y < CY - 8 ? 'auto' : y > CY + 8 ? 'hanging' : 'middle'
    return { code: p.code, label: SHORT_LABELS[p.code] ?? p.code, x, y, anchor, baseline, score: p.average }
  })

  const axes = pillarAverages.map((_, i) => {
    const max = toPoint(-90 + i * 72, MAX_R)
    return { x2: max.x, y2: max.y }
  })

  const scoreVertices = pillarAverages.map((p, i) => toPoint(-90 + i * 72, (p.average / 100) * MAX_R))

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Rendimiento por Pilar SMRP</h3>
      <svg
        viewBox="0 0 440 380"
        className="w-full max-w-md mx-auto"
        aria-label="Radar chart de rendimiento por pilares SMRP"
      >
        {/* Grid levels */}
        {gridLevels.map((frac) => (
          <polygon
            key={frac}
            points={toPolygonPoints(pillarAverages, frac)}
            fill="none"
            stroke="#d1d5db"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        ))}

        {/* Background polygon (100%) */}
        <polygon
          points={bgPoints}
          fill="#f3f4f6"
          stroke="#9ca3af"
          strokeWidth="1"
        />

        {/* Axis lines */}
        {axes.map((ax, i) => (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={ax.x2.toFixed(1)}
            y2={ax.y2.toFixed(1)}
            stroke="#d1d5db"
            strokeWidth="1"
          />
        ))}

        {/* Score polygon */}
        <polygon
          points={scorePoints}
          fill="#3b82f6"
          fillOpacity="0.25"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Score vertices */}
        {scoreVertices.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x.toFixed(1)}
            cy={pt.y.toFixed(1)}
            r="4"
            fill="#2563eb"
          />
        ))}

        {/* Labels */}
        {labels.map((lbl) => (
          <text
            key={lbl.code}
            x={lbl.x.toFixed(1)}
            y={lbl.y.toFixed(1)}
            textAnchor={lbl.anchor}
            dominantBaseline={lbl.baseline}
            fontSize="11"
            fontWeight="500"
            fill="#374151"
          >
            {lbl.label}
          </text>
        ))}

        {/* Score % labels near each vertex */}
        {pillarAverages.map((p, i) => {
          const angle_deg = -90 + i * 72
          const r = (p.average / 100) * MAX_R
          if (r < 8) return null
          const { x, y } = toPoint(angle_deg, r - 14)
          return (
            <text
              key={`score-${p.code}`}
              x={x.toFixed(1)}
              y={y.toFixed(1)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fontWeight="600"
              fill="#1d4ed8"
            >
              {p.average}%
            </text>
          )
        })}

        {/* Grid % labels on vertical axis */}
        {gridLevels.map((frac) => (
          <text
            key={`grid-${frac}`}
            x={CX + 3}
            y={(CY - frac * MAX_R).toFixed(1)}
            fontSize="8"
            fill="#9ca3af"
            dominantBaseline="middle"
          >
            {Math.round(frac * 100)}%
          </text>
        ))}
      </svg>
    </div>
  )
}
