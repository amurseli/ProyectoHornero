import { useEffect, useRef, useState } from "react"

// ─────────────────────────────────────────────────────────────────────────────
//  "Cómo funciona" — pasos con efecto sticky stack (cartas anchas y bajas).
//  Heading fijo, un ÚNICO rail de progreso sticky a la derecha que avanza según el
//  paso activo, y un número gigante de baja opacidad cortado por el borde de la card.
//  Paleta Hornero: blanco + rojo→amarillo. (NINGÚN ancestro con overflow != visible.)
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    title: "Contá tu idea",
    desc: "Seguí el paso a paso creando un título, elgiendo la duración y contando tu historia.",
  },
  {
    title: "Sumá tu contenido multimedia",
    desc: "Fotos y un video para que tu campaña enamore. La portada es lo que engancha a la primera.",
  },
  {
    title: "Publicá y compartí",
    desc: "Revisás y publicás. Tu campaña sale al instante, lista para difundir en tu comunidad.",
  },
  {
    title: "Recibí el apoyo",
    desc: "Los fondos llegan directo y cada movimiento queda en blockchain: podés demostrarles a tus backers que la plata se usó bien.",
  },
]

const N = STEPS.length

function CreatorSteps() {
  const stackRef = useRef(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const stack = stackRef.current
    if (!stack) return
    let raf = 0
    const update = () => {
      raf = 0
      const cards = stack.querySelectorAll(".cs-card")
      const line = window.innerHeight * 0.35
      let idx = 0
      cards.forEach((c, i) => {
        if (c.getBoundingClientRect().top <= line) idx = i
      })
      setActive(idx)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    update()
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section className="cs">
      <div className="cs-intro">
        <span className="cs-eyebrow">Cómo funciona</span>
        <h2 className="cs-title">Lanzar es simple</h2>
      </div>

      <div className="cs-layout">
        <div className="cs-stack" ref={stackRef}>
          {STEPS.map((s, i) => (
            <article
              className="cs-card"
              key={i}
              style={{
                top: `calc(var(--navbar-height) + 2rem + ${i * 4.5}rem)`,
                zIndex: i + 1,
              }}
            >
              <span className="cs-num-big">{String(i + 1).padStart(2, "0")}</span>
              <div className="cs-main">
                <h3 className="cs-card-title">{s.title}</h3>
                <p className="cs-card-desc">{s.desc}</p>
              </div>
            </article>
          ))}
        </div>

        {/* rail único, sticky, fuera de las cartas */}
        <div className="cs-progress" aria-hidden="true">
          <div className="cs-rail" style={{ "--fill": `${(active / (N - 1)) * 100}%` }}>
            {STEPS.map((_, j) => (
              <span
                key={j}
                className={`cs-node${j <= active ? " is-done" : ""}${j === active ? " is-active" : ""}`}
                style={{ top: `${(j / (N - 1)) * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .cs {
          position: relative;
          background: var(--color-bg-primary);
          padding: clamp(0.5rem, 2vh, 1.5rem) 0 clamp(6rem, 14vh, 9rem);
        }

        .cs-intro {
          max-width: 1120px;
          margin: 0 auto clamp(2rem, 5vh, 3.5rem);
          padding: 0 clamp(1.5rem, 6vw, 3rem);
          text-align: center;
        }

        .cs-eyebrow {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-secondary-dark);
          margin-bottom: 0.75rem;
        }

        .cs-title {
          font-family: 'Fraunces', Georgia, serif;
          font-optical-sizing: auto;
          font-weight: 450;
          font-size: clamp(1.85rem, 4.5vw, 2.85rem);
          line-height: 1.02;
          letter-spacing: -0.02em;
          color: var(--color-text-primary);
          margin: 0;
        }

        .cs-layout {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 clamp(1.5rem, 5vw, 3rem);
          display: flex;
          align-items: flex-start;
          gap: clamp(1.5rem, 3vw, 2.75rem);
        }

        .cs-stack {
          flex: 1;
          min-width: 0;
        }

        .cs-card {
          position: sticky;
          /* top y z-index inline por paso */
          min-height: 30vh;
          margin-bottom: 1.25rem;
          padding: 1.85rem clamp(1.85rem, 4vw, 3rem);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
          background: var(--color-white);
          box-shadow: 0 -6px 40px rgba(17, 24, 39, 0.10);
          overflow: hidden;
        }

        /* número gigante, baja opacidad, cortado por el borde de la card */
        .cs-num-big {
          position: absolute;
          right: -0.75rem;
          bottom: -2.75rem;
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 600;
          font-size: clamp(9rem, 22vw, 17rem);
          line-height: 0.8;
          letter-spacing: -0.04em;
          background: var(--gradient-warm);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          opacity: 0.09;
          font-variant-numeric: tabular-nums;
          pointer-events: none;
          user-select: none;
        }

        .cs-main {
          position: relative;
          z-index: 1;
        }

        .cs-card-title {
          font-family: 'Fraunces', Georgia, serif;
          font-optical-sizing: auto;
          font-weight: 500;
          font-size: clamp(1.6rem, 3.5vw, 2.5rem);
          line-height: 1.1;
          color: var(--color-text-primary);
          margin: 0 0 0.85rem;
        }

        .cs-card-desc {
          font-size: clamp(0.95rem, 1.4vw, 1.1rem);
          line-height: 1.65;
          color: var(--color-text-muted);
          margin: 0;
          max-width: 46ch;
        }

        /* ── rail único, sticky ── */
        .cs-progress {
          flex-shrink: 0;
          align-self: stretch;
          width: 22px;
        }

        .cs-rail {
          position: sticky;
          top: 42vh;
          height: 240px;
          width: 22px;
        }
        /* línea base (tenue) — de centro del primer nodo al centro del último */
        .cs-rail::before {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 2px;
          transform: translateX(-50%);
          background: var(--color-border);
        }
        /* línea llena hasta el nodo activo */
        .cs-rail::after {
          content: "";
          position: absolute;
          top: 0;
          left: 50%;
          width: 2px;
          transform: translateX(-50%);
          height: var(--fill, 0%);
          background: var(--gradient-warm);
          transition: height 0.45s ease;
        }

        .cs-node {
          position: absolute;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: var(--color-bg-primary);
          border: 2px solid var(--color-border);
          transition: width 0.2s ease, height 0.2s ease, background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .cs-node.is-done {
          border-color: transparent;
          background: var(--gradient-warm);
        }
        .cs-node.is-active {
          width: 18px;
          height: 18px;
          box-shadow: 0 0 0 5px color-mix(in srgb, var(--color-primary) 13%, transparent);
        }

        @media (max-width: 720px) {
          .cs-progress { display: none; }
          .cs-card { min-height: 26vh; }
          .cs-num-big { font-size: clamp(7rem, 30vw, 11rem); }
        }

        @media (prefers-reduced-motion: reduce) {
          .cs-card { position: static; }
        }
      `}</style>
    </section>
  )
}

export default CreatorSteps
