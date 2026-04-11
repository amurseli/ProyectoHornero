import { useNavigate } from 'react-router-dom'
import { Button } from '$components/ui'
import { Rocket, ShieldCheck, Users, BarChart2, Zap, Globe, ArrowRight } from 'lucide-react'

// ─── DATA ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Rocket,
    title: 'Lanzá en minutos',
    desc: 'Nuestro wizard te guía paso a paso para publicar tu campaña sin complicaciones.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparencia total',
    desc: 'Cada movimiento de fondos queda registrado en blockchain. Tus backers pueden verificarlo en tiempo real.',
  },
  {
    icon: Users,
    title: 'Comunidad activa',
    desc: 'Conectate con miles de personas que ya están apoyando proyectos creativos en Argentina.',
  },
  {
    icon: BarChart2,
    title: 'Seguí tu progreso',
    desc: 'Panel de control con métricas en tiempo real: recaudación, visitas y conversiones.',
  },
  {
    icon: Zap,
    title: 'Sin burocracia',
    desc: 'Creá tu campaña, recibí los fondos. Sin intermediarios innecesarios ni procesos interminables.',
  },
  {
    icon: Globe,
    title: 'Alcance regional',
    desc: 'Hornero está pensado para proyectos latinoamericanos con medios de pago locales.',
  },
]

const STEPS = [
  { number: '01', title: 'Contá tu idea', desc: 'Completá el formulario con los detalles de tu proyecto: título, descripción, objetivo y duración.' },
  { number: '02', title: 'Subí tu media', desc: 'Agregá imágenes y un video para que tu campaña sea irresistible.' },
  { number: '03', title: 'Publicá', desc: 'Revisá todo y publicá. Tu campaña aparece inmediatamente en Hornero.' },
  { number: '04', title: 'Recibí el apoyo', desc: 'La comunidad empieza a apoyarte. Los fondos llegan directo a vos.' },
]

// ─────────────────────────────────────────────────────────────────────────────

function ForCreators() {
  const navigate = useNavigate()

  return (
    <div className="fc-page">

      {/* Hero */}
      <section className="fc-hero">
        <div className="fc-hero-decor fc-hero-decor-1" />
        <div className="fc-hero-decor fc-hero-decor-2" />
        <div className="fc-hero-inner">
          <span className="fc-eyebrow">Para creadores</span>
          <h1 className="fc-hero-title">Tu idea merece<br />ser real</h1>
          <p className="fc-hero-desc">
            Hornero es la plataforma de crowdfunding con transparencia blockchain para que tus proyectos despeguen. Sin letra chica, sin vueltas.
          </p>
          <div className="fc-hero-actions">
            <Button variant="primary" size="lg" onClick={() => navigate('/campaigns/new')}>
              Crear campaña gratis
              <ArrowRight size={16} />
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/campaigns')}>
              Ver proyectos
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="fc-section fc-features-section">
        <div className="fc-container">
          <span className="fc-section-eyebrow">Herramientas</span>
          <h2 className="fc-section-title">Todo lo que necesitás</h2>
          <p className="fc-section-desc">Una plataforma construida pensando en los creadores.</p>
          <div className="fc-features-grid">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="fc-feature-card">
                <div className="fc-feature-icon">
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="fc-feature-title">{title}</h3>
                  <p className="fc-feature-desc">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="fc-section fc-steps-section">
        <div className="fc-container">
          <span className="fc-section-eyebrow">Proceso</span>
          <h2 className="fc-section-title">Cómo funciona</h2>
          <p className="fc-section-desc">De la idea a la campaña en cuatro pasos.</p>
          <div className="fc-steps">
            {STEPS.map((s, i) => (
              <div key={s.number} className="fc-step">
                <div className="fc-step-header">
                  <span className="fc-step-number-bg">{s.number}</span>
                  <span className="fc-step-number">{s.number}</span>
                </div>
                <div className="fc-step-content">
                  <h3 className="fc-step-title">{s.title}</h3>
                  <p className="fc-step-desc">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && <div className="fc-step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="fc-cta">
        <div className="fc-cta-circle" />
        <div className="fc-container fc-cta-inner">
          <h2 className="fc-cta-title">¿Estás listo?</h2>
          <p className="fc-cta-desc">Empezá hoy. Es gratis y tarda menos de 10 minutos.</p>
          <Button variant="primary" size="lg" onClick={() => navigate('/campaigns/new')}>
            Crear mi campaña
            <ArrowRight size={16} />
          </Button>
        </div>
      </section>

      <style>{`
        /* ── Page ── */
        .fc-page {
          min-height: 100vh;
          overflow: hidden;
        }

        .fc-container {
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 0 var(--space-xl);
        }

        /* ── Hero ── */
        .fc-hero {
          position: relative;
          background: var(--color-bg-primary);
          border-bottom: 1px solid var(--color-border);
          padding: 7rem var(--space-xl) 6rem;
          text-align: center;
          overflow: hidden;
        }

        .fc-hero-decor {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .fc-hero-decor-1 {
          width: 600px;
          height: 600px;
          top: -200px;
          right: -150px;
          background: var(--color-primary);
        }

        .fc-hero-decor-2 {
          width: 400px;
          height: 400px;
          bottom: -150px;
          left: -100px;
          background: var(--color-accent);
        }

        .fc-hero-inner {
          max-width: 680px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .fc-eyebrow {
          font-size: var(--font-size-xs);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--color-primary);
          background: color-mix(in srgb, var(--color-primary) 8%, transparent);
          padding: 0.375rem 1rem;
          border-radius: var(--radius-full);
          border: 1px solid color-mix(in srgb, var(--color-primary) 15%, transparent);
        }

        .fc-hero-title {
          font-size: 4rem;
          font-weight: 800;
          line-height: 1.05;
          color: var(--color-text-primary);
          letter-spacing: -0.03em;
          margin: 0;
        }

        .fc-hero-desc {
          font-size: var(--font-size-lg);
          color: var(--color-text-secondary);
          line-height: 1.65;
          margin: 0;
          max-width: 500px;
        }

        .fc-hero-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 0.75rem;
        }

        /* ── Section shared ── */
        .fc-section {
          padding: 5.5rem 0;
        }

        .fc-section-eyebrow {
          display: block;
          font-size: var(--font-size-xs);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--color-primary);
          text-align: center;
          margin-bottom: 0.75rem;
        }

        .fc-features-section {
          background: var(--color-bg-primary);
        }

        .fc-steps-section {
          background: color-mix(in srgb, var(--color-muted) 50%, var(--color-bg-primary));
          border-top: 1px solid var(--color-border);
          border-bottom: 1px solid var(--color-border);
        }

        .fc-section-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--color-text-primary);
          text-align: center;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .fc-section-desc {
          font-size: var(--font-size-lg);
          color: var(--color-text-muted);
          text-align: center;
          margin-bottom: 3.5rem;
        }

        /* ── Features grid (bento style) ── */
        .fc-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--color-border);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }

        .fc-feature-card {
          padding: 2rem;
          background: var(--color-bg-primary);
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          transition: background var(--transition-base);
        }

        .fc-feature-card:hover {
          background: color-mix(in srgb, var(--color-muted) 60%, var(--color-bg-primary));
        }

        .fc-feature-icon {
          width: 2.5rem;
          height: 2.5rem;
          min-width: 2.5rem;
          border-radius: var(--radius-lg);
          background: color-mix(in srgb, var(--color-primary) 8%, transparent);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background var(--transition-base), color var(--transition-base);
        }

        .fc-feature-card:hover .fc-feature-icon {
          background: var(--color-primary);
          color: white;
        }

        .fc-feature-title {
          font-size: var(--font-size-base);
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 0.35rem;
        }

        .fc-feature-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: 1.6;
        }

        /* ── Steps (editorial numbers) ── */
        .fc-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
        }

        .fc-step {
          position: relative;
          padding: 2rem 1.5rem;
          text-align: left;
        }

        .fc-step-header {
          position: relative;
          height: 5rem;
          margin-bottom: 1.25rem;
          overflow: hidden;
        }

        .fc-step-number-bg {
          font-size: 6rem;
          font-weight: 900;
          color: var(--color-primary);
          line-height: 1;
          position: absolute;
          top: -0.5rem;
          left: -0.25rem;
          letter-spacing: -0.05em;
          user-select: none;
        }

        .fc-step-number {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-sm);
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          color: var(--color-primary);
          width: 2.75rem;
          height: 2.75rem;
          border: 2px solid var(--color-primary);
          border-radius: var(--radius-lg);
          background: var(--color-bg-primary);
          top: 0.75rem;
          transition: background var(--transition-base), color var(--transition-base);
        }

        .fc-step:hover .fc-step-number {
          background: var(--color-primary);
          color: white;
        }

        .fc-step-connector {
          position: absolute;
          top: 3.25rem;
          right: -1rem;
          width: 2rem;
          height: 2px;
          background: var(--color-border);
          z-index: 2;
        }

        .fc-step-content {
          position: relative;
        }

        .fc-step-title {
          font-size: var(--font-size-base);
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 0.5rem;
        }

        .fc-step-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: 1.65;
        }

        /* ── CTA (solid bg, no gradient) ── */
        .fc-cta {
          background: var(--color-primary);
          padding: 5rem 0;
          position: relative;
          overflow: hidden;
        }

        .fc-cta-circle {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          top: -250px;
          right: -100px;
          background: white;
          pointer-events: none;
        }

        .fc-cta-inner {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          position: relative;
          z-index: 1;
        }

        .fc-cta-title {
          font-size: 2.75rem;
          font-weight: 800;
          color: white;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .fc-cta-desc {
          font-size: var(--font-size-lg);
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .fc-cta .btn-primary,
        .fc-cta [class*="primary"] {
          background: white !important;
          color: var(--color-primary) !important;
          border-color: white !important;
        }

        .fc-cta .btn-primary:hover,
        .fc-cta [class*="primary"]:hover {
          box-shadow: 0 4px 24px rgba(255, 255, 255, 0.15) !important;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .fc-features-grid { grid-template-columns: repeat(2, 1fr); }
          .fc-steps {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }
          .fc-step-connector { display: none; }
        }

        @media (max-width: 640px) {
          .fc-hero { padding: 5rem var(--space-md) 4rem; }
          .fc-hero-title { font-size: 2.75rem; }
          .fc-features-grid { grid-template-columns: 1fr; }
          .fc-steps { grid-template-columns: 1fr; }
          .fc-section { padding: 3.5rem 0; }
          .fc-cta-title { font-size: 2rem; }
          .fc-step { padding: 1.5rem 1rem; }
        }
      `}</style>
    </div>
  )
}

export default ForCreators
