import { useEffect, useRef } from "react"
import { HeroButton } from "$components/ui"
import "./LandingCta.css"

// ─────────────────────────────────────────────────────────────────────────────
//  LandingCta — CTA de cierre. Panel navy sobre página blanca; HeroButton y un
//  backlight cálido grande y difuso que sigue al mouse (CSS + variables, sin
//  shader). En reposo descansa arriba-centro; al hover del botón crece.
//    <LandingCta title="…" desc="…" buttonLabel="…" onButton={() => nav(...)} />
// ─────────────────────────────────────────────────────────────────────────────

function LandingCta({ title, desc, buttonLabel, onButton }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const glow = panel.querySelector(".cta-follow")
    if (!glow) return

    const rest = () => {
      const r = panel.getBoundingClientRect()
      glow.style.setProperty("--mx", `${r.width / 2}px`)
      glow.style.setProperty("--my", `${r.height * 0.38}px`)
    }
    const onMove = (e) => {
      const r = panel.getBoundingClientRect()
      glow.style.setProperty("--mx", `${e.clientX - r.left}px`)
      glow.style.setProperty("--my", `${e.clientY - r.top}px`)
    }

    rest()
    panel.addEventListener("pointermove", onMove)
    panel.addEventListener("pointerleave", rest)
    window.addEventListener("resize", rest)
    return () => {
      panel.removeEventListener("pointermove", onMove)
      panel.removeEventListener("pointerleave", rest)
      window.removeEventListener("resize", rest)
    }
  }, [])

  return (
    <section className="cta">
      <div className="cta-panel" ref={panelRef}>
        <div className="cta-follow" aria-hidden="true" />
        <div className="cta-inner">
          <h2 className="cta-title">{title}</h2>
          {desc && <p className="cta-desc">{desc}</p>}
          {buttonLabel && (
            <HeroButton onClick={onButton}>{buttonLabel}</HeroButton>
          )}
        </div>
      </div>
    </section>
  )
}

export default LandingCta
