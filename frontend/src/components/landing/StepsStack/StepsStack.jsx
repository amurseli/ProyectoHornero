import { useEffect, useRef, useState } from "react"
import SectionHeading from "../SectionHeading/SectionHeading.jsx"
import "./StepsStack.css"

// ─────────────────────────────────────────────────────────────────────────────
//  StepsStack — pasos con efecto sticky stack (cartas anchas y bajas que se apilan
//  dejando asomar el título), número gigante cortado por el borde, y un rail de
//  progreso sticky a la derecha que avanza según el paso activo (por scroll).
//  Paleta Hornero: blanco + rojo→amarillo.
//    <StepsStack eyebrow="Cómo funciona" title="Lanzar es simple" steps={[...]} />
//  steps: [{ title, desc }]
// ─────────────────────────────────────────────────────────────────────────────

function StepsStack({ eyebrow, title, steps = [] }) {
  const stackRef = useRef(null)
  const [active, setActive] = useState(0)
  const n = steps.length

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
        <SectionHeading eyebrow={eyebrow} title={title} />
      </div>

      <div className="cs-layout">
        <div className="cs-stack" ref={stackRef}>
          {steps.map((s, i) => (
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
          <div className="cs-rail" style={{ "--fill": `${n > 1 ? (active / (n - 1)) * 100 : 0}%` }}>
            {steps.map((_, j) => (
              <span
                key={j}
                className={`cs-node${j <= active ? " is-done" : ""}${j === active ? " is-active" : ""}`}
                style={{ top: `${n > 1 ? (j / (n - 1)) * 100 : 0}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default StepsStack
