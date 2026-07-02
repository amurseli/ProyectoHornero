import { useNavigate } from "react-router-dom"
import { HeroButton } from "$components/ui"
import SuccessStories from "./sections/SuccessStories"
import CreatorSteps from "./sections/CreatorSteps"
import CreatorCta from "./sections/CreatorCta"

// La foto vive en public/ → se referencia por path raíz
const HERO_IMG = "/for-creators-image.jpg"

// ─────────────────────────────────────────────────────────────────────────────
//  ForCreators — landing de creadores
//  hero (imagen CSS) → historias de éxito → cómo funciona → CTA
// ─────────────────────────────────────────────────────────────────────────────

function ForCreators() {
  const navigate = useNavigate()

  return (
    <div className="fc-page">

      {/* ── HERO ── */}
      <section className="fc-hero">
        <div className="fc-hero-img" style={{ backgroundImage: `url(${HERO_IMG})` }} />
        <div className="fc-hero-scrim" />
        <div className="fc-hero-fade" />

        <div className="fc-hero-content">
          <h1 className="fc-hero-title">
            Dale vuelo<br />a tus ideas
          </h1>
          <p className="fc-hero-sub">
            Lanzá tu campaña y dejá que la comunidad la haga despegar.
            Crowdfunding con transparencia real, de principio a fin.
          </p>
          <HeroButton onClick={() => navigate("/my-campaigns/new")}>
            Crear mi campaña
          </HeroButton>
        </div>
      </section>

      {/* ── HISTORIAS DE ÉXITO ── */}
      <SuccessStories />

      {/* ── CÓMO FUNCIONA (pasos sticky stack) ── */}
      <CreatorSteps />

      {/* ── CTA DE CIERRE ── */}
      <CreatorCta />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&display=swap');

        .fc-page { width: 100%; }

        /* ── HERO ── */
        .fc-hero {
          position: relative;
          width: 100%;
          height: calc(100vh - var(--navbar-height));
          min-height: 560px;
          max-height: 860px;
          overflow: hidden;
          isolation: isolate;
          background: var(--color-bg-primary);
        }

        .fc-hero-img {
          position: absolute;
          inset: 0;
          z-index: 0;
          background-size: cover;
          background-position: center 38%;
          animation: fc-img-in 1.5s ease both;
        }

        @keyframes fc-img-in {
          from { transform: scale(1.06); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }

        /* scrim de legibilidad (abajo-izquierda) */
        .fc-hero-scrim {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            linear-gradient(105deg,
              rgba(28, 20, 12, 0.62) 0%,
              rgba(28, 20, 12, 0.34) 38%,
              rgba(28, 20, 12, 0.05) 62%,
              transparent 78%);
        }

        /* fundido inferior con el fondo de la página */
        .fc-hero-fade {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 42%;
          z-index: 2;
          pointer-events: none;
          background: linear-gradient(to bottom,
            transparent 0%,
            color-mix(in srgb, var(--color-bg-primary) 55%, transparent) 58%,
            var(--color-bg-primary) 94%);
        }

        .fc-hero-content {
          position: absolute;
          z-index: 3;
          left: clamp(1.5rem, 6vw, 6rem);
          bottom: clamp(6rem, 24vh, 12rem);
          max-width: 640px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1.5rem;
          animation: fc-content-in 1s ease 0.35s both;
        }

        @keyframes fc-content-in {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .fc-hero-title {
          font-family: 'Fraunces', Georgia, serif;
          font-optical-sizing: auto;
          font-weight: 450;
          font-size: clamp(3rem, 8.5vw, 6.25rem);
          line-height: 0.98;
          letter-spacing: -0.02em;
          color: #fff;
          margin: 0;
          text-shadow: 0 2px 30px rgba(0, 0, 0, 0.35);
        }

        .fc-hero-sub {
          font-family: var(--font-sans);
          font-size: clamp(1rem, 1.4vw, 1.2rem);
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.88);
          margin: 0;
          max-width: 460px;
          text-shadow: 0 1px 16px rgba(0, 0, 0, 0.35);
        }

        /* ── responsive ── */
        @media (max-width: 640px) {
          .fc-hero {
            height: auto;
            min-height: calc(100vh - var(--navbar-height));
          }
          .fc-hero-content {
            left: 1.5rem;
            right: 1.5rem;
            bottom: clamp(4rem, 16vh, 7rem);
            max-width: none;
          }
        }
      `}</style>
    </div>
  )
}

export default ForCreators
