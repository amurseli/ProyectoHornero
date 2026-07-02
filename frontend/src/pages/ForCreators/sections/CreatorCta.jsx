import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { HeroButton } from "$components/ui"

// ─────────────────────────────────────────────────────────────────────────────
//  CTA de cierre. Panel navy (igual que el footer) sobre página blanca; botón pill
//  blanco (como el hero) y un backlight cálido grande y difuso que SIGUE al mouse
//  dentro del panel (CSS + variables, sin shader). En reposo descansa arriba-centro.
// ─────────────────────────────────────────────────────────────────────────────

function CreatorCta() {
  const navigate = useNavigate()
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
          <h2 className="cta-title">¿Listo para darle vuelo?</h2>
          <p className="cta-desc">
            Crear tu campaña es gratis y toma menos de 10 minutos.
            Sumate a los creadores que ya despegaron con Hornero.
          </p>

          <HeroButton onClick={() => navigate("/my-campaigns/new")}>
            Crear mi campaña
          </HeroButton>
        </div>
      </div>

      <style>{`
        .cta {
          background: var(--color-bg-primary);
          padding: clamp(2rem, 5vh, 4rem) clamp(1.5rem, 5vw, 3rem) clamp(5rem, 12vh, 8rem);
        }

        .cta-panel {
          position: relative;
          max-width: 1000px;
          margin: 0 auto;
          padding: clamp(3.5rem, 8vw, 6rem) clamp(1.5rem, 5vw, 3rem);
          border-radius: 2rem;
          overflow: hidden;
          text-align: center;
          color: #fff;
          background: radial-gradient(130% 130% at 50% 0%, #1b2334 0%, var(--color-text-primary) 72%);
          box-shadow: var(--shadow-xl);
          isolation: isolate;
        }

        /* backlight cálido, grande y difuso, que sigue al mouse */
        .cta-follow {
          position: absolute;
          left: 0;
          top: 0;
          width: 720px;
          height: 720px;
          z-index: 0;
          pointer-events: none;
          transform: translate(calc(var(--mx, 50%) - 360px), calc(var(--my, 40%) - 360px));
          transition: transform 0.3s ease;
          background: radial-gradient(closest-side,
            color-mix(in srgb, var(--color-primary) 55%, transparent) 0%,
            color-mix(in srgb, var(--color-secondary) 22%, transparent) 48%,
            transparent 72%);
          filter: blur(40px);
          opacity: 0.85;
        }

        /* al pasar el mouse por el botón, el backlight crece e intensifica */
        .cta-panel:has(.hero-btn:hover) .cta-follow {
          transform: translate(calc(var(--mx, 50%) - 360px), calc(var(--my, 40%) - 360px)) scale(1.7);
          opacity: 1;
          filter: blur(50px);
        }

        .cta-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }

        .cta-title {
          font-family: 'Fraunces', Georgia, serif;
          font-optical-sizing: auto;
          font-weight: 450;
          font-size: clamp(2rem, 5vw, 3.5rem);
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin: 0;
          color: #fff;
        }

        .cta-desc {
          font-size: clamp(1rem, 1.5vw, 1.2rem);
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.72);
          margin: 0;
          max-width: 44ch;
        }

        .cta-inner .hero-btn { margin-top: 0.5rem; }

        @media (prefers-reduced-motion: reduce) {
          .cta-follow { transition: none; }
        }
      `}</style>
    </section>
  )
}

export default CreatorCta
