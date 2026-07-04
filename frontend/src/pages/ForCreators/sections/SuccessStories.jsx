import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Music, Film, Sprout, Gamepad2, BookOpen, Palette, Coffee, Shirt, Sparkles } from "lucide-react"
import { campaignService, getCampaignPath } from "$utils/campaignService"

// ─────────────────────────────────────────────────────────────────────────────
//  Carrusel "Historias de éxito" — cinta continua (autoplay + manual).
//  Pide campañas TERMINADAS reales (status=SUCCESSFUL) al backend y las hace
//  clickeables → campaña real. Si vienen 0 (o falla), cae a data curada estática
//  para no quedar nunca vacío.
// ─────────────────────────────────────────────────────────────────────────────

const GRADIENTS = [
  "linear-gradient(150deg,#E11D48,#7C3AED)",
  "linear-gradient(150deg,#4C1D95,#7C3AED)",
  "linear-gradient(150deg,#0D9488,#84CC16)",
  "linear-gradient(150deg,#1D4ED8,#38BDF8)",
  "linear-gradient(150deg,#B45309,#FACC15)",
  "linear-gradient(150deg,#BE123C,#F472B6)",
  "linear-gradient(150deg,#78350F,#F59E0B)",
  "linear-gradient(150deg,#0F766E,#2DD4BF)",
]

const ICON_BY_CATEGORY = {
  "Música": Music, "Películas": Film, "Comida": Coffee, "Juegos": Gamepad2,
  "Publicaciones": BookOpen, "Periodismo": BookOpen, "Arte": Palette,
  "Moda": Shirt, "Fotografía": Sparkles,
}

// Fallback curado (solo degradé + ícono, sin fotos). Se usa si la API devuelve 0.
const FALLBACK = [
  { title: "Sinfonía del Sur", creator: "Camila Rossi",      category: "Música",         icon: Music,    raised: 4200000, pct: 138, grad: GRADIENTS[0], href: "/explorar" },
  { title: "Raíces",           creator: "Colectivo Andar",   category: "Cine",           icon: Film,     raised: 6800000, pct: 112, grad: GRADIENTS[1], href: "/explorar" },
  { title: "Huerta Vertical",  creator: "Tomás Vega",        category: "Sostenibilidad", icon: Sprout,   raised: 2100000, pct: 105, grad: GRADIENTS[2], href: "/explorar" },
  { title: "Pixel Nómade",     creator: "Estudio Lumen",     category: "Videojuegos",    icon: Gamepad2, raised: 9300000, pct: 210, grad: GRADIENTS[3], href: "/explorar" },
  { title: "Revista Hornero",  creator: "Ala Editorial",     category: "Editorial",      icon: BookOpen, raised: 1500000, pct: 124, grad: GRADIENTS[4], href: "/explorar" },
  { title: "Cerámica Viva",    creator: "Manos del Litoral", category: "Arte",           icon: Palette,  raised: 3050000, pct: 156, grad: GRADIENTS[5], href: "/explorar" },
  { title: "Café de Altura",   creator: "Finca Aurora",      category: "Gastronomía",    icon: Coffee,   raised: 5400000, pct: 118, grad: GRADIENTS[6], href: "/explorar" },
  { title: "Telar Futuro",     creator: "Trama Coop.",       category: "Moda",           icon: Shirt,    raised: 2750000, pct: 132, grad: GRADIENTS[7], href: "/explorar" },
]

function money(n) {
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1).replace(".", ",") + "M"
  if (n >= 1e3) return "$" + Math.round(n / 1e3) + "k"
  return "$" + n
}

function toCard(c, i) {
  const first = c.owner?.firstName, last = c.owner?.lastName
  const creator = [first, last].filter(Boolean).join(" ") || c.owner?.userName || "Creador"
  const target = Number(c.targetAmount) || 0
  const raised = Number(c.currentAmount) || 0
  return {
    title: c.title,
    creator,
    category: c.category || "General",
    raised,
    pct: target > 0 ? Math.round((raised / target) * 100) : 100,
    img: c.imageUrl,
    grad: GRADIENTS[i % GRADIENTS.length],
    icon: ICON_BY_CATEGORY[c.category] || null,
    href: getCampaignPath(c),
  }
}

function SuccessStories() {
  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const movedRef = useRef(false)
  const [stories, setStories] = useState(FALLBACK)

  // ── Traer campañas terminadas reales (con fallback a la data curada) ──
  useEffect(() => {
    let alive = true
    campaignService
      .browseCampaigns({ status: "SUCCESSFUL", sort: "funded", size: 12 })
      .then(({ campaigns }) => {
        if (alive && campaigns && campaigns.length) {
          setStories(campaigns.map(toCard))
        }
      })
      .catch(() => { /* se queda con el fallback */ })
    return () => { alive = false }
  }, [])

  // ── Marquee: autoplay + hover-pause + drag + flechas ──
  useEffect(() => {
    const vp = viewportRef.current
    const track = trackRef.current
    if (!vp || !track) return

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const SPEED = 0.5

    let paused = false
    let dragging = false
    let startX = 0
    let startScroll = 0
    let rafId = 0

    vp.scrollLeft = 1

    function wrap() {
      const setW = track.scrollWidth / 2
      if (setW <= 0) return
      if (vp.scrollLeft >= setW) vp.scrollLeft -= setW
      else if (vp.scrollLeft <= 0) vp.scrollLeft += setW
    }
    function step() {
      if (!paused && !dragging && !reduce) vp.scrollLeft += SPEED
      wrap()
      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)

    const onEnter = () => { paused = true }
    const onLeave = () => { paused = false }

    // Drag SOLO con mouse (sin pointer capture, para no romper el click del Link).
    // Touch/pen usan el scroll nativo del viewport.
    function onMove(e) {
      if (!dragging) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > 6) movedRef.current = true
      vp.scrollLeft = startScroll - dx
    }
    function onUp() {
      if (!dragging) return
      dragging = false
      vp.classList.remove("is-dragging")
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      // el guard onCardClick lee movedRef en el click (que dispara justo después);
      // lo reseteo en el próximo tick para no bloquear el siguiente click.
      setTimeout(() => { movedRef.current = false }, 0)
    }
    function onDown(e) {
      if (e.pointerType && e.pointerType !== "mouse") return
      dragging = true
      movedRef.current = false
      startX = e.clientX
      startScroll = vp.scrollLeft
      vp.classList.add("is-dragging")
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    }

    vp.addEventListener("mouseenter", onEnter)
    vp.addEventListener("mouseleave", onLeave)
    vp.addEventListener("pointerdown", onDown)

    return () => {
      cancelAnimationFrame(rafId)
      vp.removeEventListener("mouseenter", onEnter)
      vp.removeEventListener("mouseleave", onLeave)
      vp.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [stories])

  // no navegar si el click viene de arrastrar
  function onCardClick(e) {
    if (movedRef.current) e.preventDefault()
  }

  const cards = [...stories, ...stories]

  return (
    <section className="ss">
      <div className="ss-head">
        <span className="ss-eyebrow">Historias reales</span>
        <h2 className="ss-title">Ideas que ya remontaron vuelo</h2>
      </div>

      <div className="ss-viewport" ref={viewportRef}>
        <div className="ss-track" ref={trackRef}>
          {cards.map((s, i) => {
            const Icon = s.icon
            return (
              <Link
                className="ss-card"
                key={i}
                to={s.href || "/explorar"}
                onClick={onCardClick}
                draggable="false"
                style={{ backgroundImage: s.grad }}
              >
                {Icon && <Icon className="ss-card-motif" size={120} strokeWidth={1} aria-hidden="true" />}
                {s.img && (
                  <img
                    className="ss-card-photo"
                    src={s.img}
                    alt=""
                    draggable="false"
                    loading="lazy"
                    onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                    onError={(e) => { e.currentTarget.style.display = "none" }}
                  />
                )}
                <span className="ss-chip">{s.category}</span>

                <div className="ss-card-overlay">
                  <h3 className="ss-card-title">{s.title}</h3>
                  <p className="ss-card-creator">por {s.creator}</p>
                  <div className="ss-bar">
                    <div className="ss-bar-fill" style={{ width: `${Math.min(s.pct, 100)}%` }} />
                  </div>
                  <div className="ss-card-stats">
                    <span className="ss-raised">{money(s.raised)}</span>
                    <span className="ss-pct">{s.pct}% financiado</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <style>{`
        .ss {
          position: relative;
          padding: clamp(3rem, 8vh, 6rem) 0 clamp(4rem, 10vh, 7rem);
          background: var(--color-bg-primary);
        }

        .ss-head {
          max-width: var(--max-width);
          margin: 0 auto 2.5rem;
          padding: 0 clamp(1.5rem, 6vw, 6rem);
        }

        .ss-eyebrow {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-secondary-dark);
          margin-bottom: 0.6rem;
        }

        .ss-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: clamp(2rem, 4.5vw, 3.25rem);
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: var(--color-text-primary);
          margin: 0;
        }

        .ss-viewport {
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          cursor: grab;
          padding: 1.5rem 0 2.25rem;
          -webkit-mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
                  mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
        }
        .ss-viewport::-webkit-scrollbar { display: none; }
        .ss-viewport.is-dragging { cursor: grabbing; }

        .ss-track {
          display: flex;
          gap: 1.5rem;
          padding: 0 clamp(1.5rem, 6vw, 6rem);
          width: max-content;
        }

        /* ── CARD: imagen a sangre + texto encima ── */
        .ss-card {
          position: relative;
          display: block;
          width: 300px;
          aspect-ratio: 3 / 4;
          flex-shrink: 0;
          border-radius: var(--radius-xl);
          overflow: hidden;
          background-size: cover;
          background-position: center;
          box-shadow: var(--shadow-md);
          user-select: none;
          text-decoration: none;
          transition: transform var(--transition-base), box-shadow var(--transition-base);
        }

        .ss-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-xl);
        }

        .ss-card-motif {
          position: absolute;
          top: 1.75rem;
          right: 1.25rem;
          z-index: 0;
          color: rgba(255, 255, 255, 0.18);
          pointer-events: none;
        }

        .ss-card-photo {
          position: absolute;
          inset: 0;
          z-index: 1;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .ss-card-photo.is-loaded { opacity: 1; }

        .ss-chip {
          position: absolute;
          z-index: 2;
          top: 1rem;
          left: 1rem;
          font-size: 0.7rem;
          font-weight: 600;
          color: #fff;
          background: rgba(255, 255, 255, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 0.3rem 0.75rem;
          border-radius: var(--radius-full);
          backdrop-filter: blur(6px);
        }

        .ss-card-overlay {
          position: absolute;
          z-index: 2;
          inset: auto 0 0 0;
          padding: 2.5rem 1.25rem 1.25rem;
          background: linear-gradient(to top,
            rgba(15, 12, 20, 0.88) 0%,
            rgba(15, 12, 20, 0.55) 45%,
            transparent 100%);
          color: #fff;
        }

        .ss-card-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.5rem;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin: 0 0 0.1rem;
        }

        .ss-card-creator {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.75);
          margin: 0 0 0.9rem;
        }

        .ss-bar {
          height: 5px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.25);
          overflow: hidden;
          margin-bottom: 0.6rem;
        }

        .ss-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
          background: #fff;
        }

        .ss-card-stats {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }

        .ss-raised { font-size: 1.05rem; font-weight: 800; color: #fff; }
        .ss-pct { font-size: 0.8rem; font-weight: 600; color: rgba(255, 255, 255, 0.9); }

        @media (max-width: 640px) {
          .ss-card { width: 260px; }
        }
      `}</style>
    </section>
  )
}

export default SuccessStories
