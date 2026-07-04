import { useEffect, useRef } from "react"
import "./TrustNetwork.css"

// ─────────────────────────────────────────────────────────────────────────────
//  TrustNetwork — red interactiva (decorativa + hubs). Las líneas se DIBUJAN al
//  entrar en viewport (SVG, stroke-dashoffset). Algunos nodos son "hubs" con ícono
//  (HTML encima): al hover crecen, enfocan (atenúan el resto) y muestran texto.
//    <TrustNetwork hubs={[{icon, title, desc}, …]} />  // hasta 4, por índice
// ─────────────────────────────────────────────────────────────────────────────

// viewBox 1440 x 460 (ancho y bajo, full-bleed). La red es una TRIANGULACIÓN por
// franjas (3 filas A/B/C) → ninguna arista se cruza, por construcción. Varios
// nodos quedan fuera del viewBox (x<0 o x>1440) y el overflow los recorta → la
// red "sigue" más allá de la pantalla. hub = índice del hub (0..3), centrados.
// Alturas en zigzag y espacios horizontales irregulares → orgánico, no uniforme.
// Se respeta: x creciente por fila, y cada nodo del medio (B) entre sus vecinos
// de A y de C → la triangulación sigue sin cruces.
const NODES = [
  // Fila A (arriba)                              idx 0..7
  { x: -100, y: 120, r: 4 },
  { x: 120,  y: 60,  r: 4 },
  { x: 330,  y: 145, r: 5 },
  { x: 560,  y: 80,  r: 6, hub: 1 },
  { x: 760,  y: 160, r: 5 },
  { x: 1050, y: 70,  r: 4 },
  { x: 1300, y: 150, r: 4 },
  { x: 1560, y: 95,  r: 4 },
  // Fila B (medio)                               idx 8..14
  { x: 10,   y: 250, r: 4 },
  { x: 230,  y: 300, r: 6, hub: 0 },
  { x: 430,  y: 220, r: 5 },
  { x: 660,  y: 290, r: 4 },
  { x: 900,  y: 230, r: 5 },
  { x: 1180, y: 300, r: 6, hub: 3 },
  { x: 1430, y: 240, r: 4 },
  // Fila C (abajo)                               idx 15..22
  { x: -80,  y: 410, r: 4 },
  { x: 160,  y: 450, r: 4 },
  { x: 400,  y: 375, r: 5 },
  { x: 600,  y: 440, r: 4 },
  { x: 830,  y: 390, r: 6, hub: 2 },
  { x: 1120, y: 450, r: 4 },
  { x: 1360, y: 395, r: 4 },
  { x: 1580, y: 435, r: 4 },
]

const EDGES = [
  // horizontales por fila
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14],
  [15, 16], [16, 17], [17, 18], [18, 19], [19, 20], [20, 21], [21, 22],
  // franja A–B (triangle strip: a_i–b_i, b_i–a_{i+1})
  [0, 8], [8, 1], [1, 9], [9, 2], [2, 10], [10, 3], [3, 11], [11, 4],
  [4, 12], [12, 5], [5, 13], [13, 6], [6, 14], [14, 7],
  // franja B–C (triangle strip: c_i–b_i, b_i–c_{i+1})
  [15, 8], [8, 16], [16, 9], [9, 17], [17, 10], [10, 18], [18, 11], [11, 19],
  [19, 12], [12, 20], [20, 13], [13, 21], [21, 14], [14, 22],
]

const VW = 1440
const VH = 460

function TrustNetwork({ hubs = [] }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("is-in")
            io.disconnect()
          }
        })
      },
      { threshold: 0.3 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="tn" ref={ref}>
      <svg className="tn-svg" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient id="tn-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--color-primary)" }} />
            <stop offset="100%" style={{ stopColor: "var(--color-secondary)" }} />
          </linearGradient>
        </defs>

        <g className="tn-edges">
          {EDGES.map(([a, b], i) => (
            <line
              key={i}
              x1={NODES[a].x} y1={NODES[a].y}
              x2={NODES[b].x} y2={NODES[b].y}
              pathLength="1"
              style={{ transitionDelay: `${i * 0.035}s` }}
            />
          ))}
        </g>

        <g className="tn-dots">
          {NODES.map((n, i) =>
            n.hub == null ? (
              <circle key={i} cx={n.x} cy={n.y} r={n.r} style={{ transitionDelay: `${0.4 + i * 0.03}s` }} />
            ) : null
          )}
        </g>
      </svg>

      {/* hubs interactivos (HTML encima de la red) */}
      {NODES.map((n, i) => {
        if (n.hub == null) return null
        const hub = hubs[n.hub]
        if (!hub) return null
        const Icon = hub.icon
        const lower = n.y / VH > 0.55
        return (
          <div
            key={`hub-${i}`}
            className={`tn-hub${lower ? " is-lower" : ""}`}
            style={{
              left: `${(n.x / VW) * 100}%`,
              top: `${(n.y / VH) * 100}%`,
              transitionDelay: `${0.6 + n.hub * 0.1}s`,
              "--pulse-delay": `${-n.hub * 0.7}s`,
            }}
          >
            <span className="tn-hub-glow" aria-hidden="true" />
            <div className="tn-hub-dot">
              {Icon && <Icon size={22} strokeWidth={1.9} />}
            </div>
            <div className="tn-hub-tip">
              <strong>{hub.title}</strong>
              <span>{hub.desc}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TrustNetwork
