import { useNavigate } from 'react-router-dom'
import { Button } from '$components/ui'
import { Search, HeartHandshake, Link2, BarChart2, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react'

// ─── DATA ────────────────────────────────────────────────────────────────────

const STEPS = [
  { number: '01', title: 'Descubrí proyectos', desc: 'Explorá campañas de creadores de toda la región y encontrá las ideas que querés ver realizadas.' },
  { number: '02', title: 'Apoyá con tu aporte', desc: 'Elegí cuánto querés aportar y sumate con un par de clics usando medios de pago locales.' },
  { number: '03', title: 'Seguí en blockchain', desc: 'Cada movimiento de fondos queda registrado de forma transparente y verificable en tiempo real.' },
  { number: '04', title: 'Mirá cómo despega', desc: 'Acompañá el progreso de la campaña y recibí novedades del creador hasta que alcance su meta.' },
]

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Transparencia blockchain',
    desc: 'Los fondos y su uso quedan registrados en la blockchain. Nada de cajas negras: todo es auditable.',
  },
  {
    icon: HeartHandshake,
    title: 'Apoyo directo',
    desc: 'Tu aporte llega directo al creador, sin intermediarios que se queden con una tajada innecesaria.',
  },
  {
    icon: Link2,
    title: 'Verificable por cualquiera',
    desc: 'No hace falta confiar a ciegas: podés comprobar cada transacción vos mismo en la cadena.',
  },
  {
    icon: BarChart2,
    title: 'Progreso en vivo',
    desc: 'Mirá la recaudación y el avance de cada campaña actualizándose en tiempo real.',
  },
  {
    icon: Search,
    title: 'Proyectos curados',
    desc: 'Descubrí ideas creativas de la región organizadas para que encuentres lo que te interesa.',
  },
  {
    icon: Sparkles,
    title: 'Simple de usar',
    desc: 'Pensado para que apoyar o lanzar un proyecto sea cuestión de minutos, no de trámites.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────

function HowItWorks() {
  const navigate = useNavigate()

  return (
    <div className="hiw-page">

      {/* Hero */}
      <section className="hiw-hero">
        <div className="hiw-hero-decor hiw-hero-decor-1" />
        <div className="hiw-hero-decor hiw-hero-decor-2" />
        <div className="hiw-hero-inner">
          <span className="hiw-eyebrow">Cómo funciona</span>
          <h1 className="hiw-hero-title">Apoyar un proyecto<br />nunca fue tan claro</h1>
          <p className="hiw-hero-desc">
            Hornero conecta a creadores con personas que quieren ver sus ideas hechas realidad, con la transparencia de la blockchain en cada paso.
          </p>
          <div className="hiw-hero-actions">
            <Button variant="primary" size="lg" onClick={() => navigate('/explorar')}>
              Explorar campañas
              <ArrowRight size={16} />
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/for-creators')}>
              Quiero crear una campaña
            </Button>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="hiw-section hiw-steps-section">
        <div className="hiw-container">
          <span className="hiw-section-eyebrow">Proceso</span>
          <h2 className="hiw-section-title">En cuatro pasos</h2>
          <p className="hiw-section-desc">Del descubrimiento al apoyo, sin vueltas.</p>
          <div className="hiw-steps">
            {STEPS.map((s, i) => (
              <div key={s.number} className="hiw-step">
                <div className="hiw-step-header">
                  <span className="hiw-step-number-bg">{s.number}</span>
                  <span className="hiw-step-number">{s.number}</span>
                </div>
                <div className="hiw-step-content">
                  <h3 className="hiw-step-title">{s.title}</h3>
                  <p className="hiw-step-desc">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && <div className="hiw-step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="hiw-section hiw-features-section">
        <div className="hiw-container">
          <span className="hiw-section-eyebrow">Por qué Hornero</span>
          <h2 className="hiw-section-title">Confianza por diseño</h2>
          <p className="hiw-section-desc">Una plataforma donde apoyar proyectos es transparente de verdad.</p>
          <div className="hiw-features-grid">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="hiw-feature-card">
                <div className="hiw-feature-icon">
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="hiw-feature-title">{title}</h3>
                  <p className="hiw-feature-desc">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="hiw-cta">
        <div className="hiw-cta-circle" />
        <div className="hiw-container hiw-cta-inner">
          <h2 className="hiw-cta-title">¿Listo para empezar?</h2>
          <p className="hiw-cta-desc">Encontrá un proyecto para apoyar o lanzá el tuyo hoy mismo.</p>
          <Button variant="primary" size="lg" onClick={() => navigate('/explorar')}>
            Ver proyectos
            <ArrowRight size={16} />
          </Button>
        </div>
      </section>

      <style>{`
        /* ── Page ── */
        .hiw-page {
          min-height: 100vh;
          overflow: hidden;
        }

        .hiw-container {
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 0 var(--space-xl);
        }

        /* ── Hero ── */
        .hiw-hero {
          position: relative;
          background: var(--color-bg-primary);
          border-bottom: 1px solid var(--color-border);
          padding: 7rem var(--space-xl) 6rem;
          text-align: center;
          overflow: hidden;
        }

        .hiw-hero-decor {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .hiw-hero-decor-1 {
          width: 600px;
          height: 600px;
          top: -200px;
          right: -150px;
          background: var(--color-primary);
        }

        .hiw-hero-decor-2 {
          width: 400px;
          height: 400px;
          bottom: -150px;
          left: -100px;
          background: var(--color-accent);
        }

        .hiw-hero-inner {
          max-width: 680px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .hiw-eyebrow {
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

        .hiw-hero-title {
          font-size: 4rem;
          font-weight: 800;
          line-height: 1.05;
          color: var(--color-text-primary);
          letter-spacing: -0.03em;
          margin: 0;
        }

        .hiw-hero-desc {
          font-size: var(--font-size-lg);
          color: var(--color-text-secondary);
          line-height: 1.65;
          margin: 0;
          max-width: 520px;
        }

        .hiw-hero-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 0.75rem;
        }

        /* ── Section shared ── */
        .hiw-section {
          padding: 5.5rem 0;
        }

        .hiw-section-eyebrow {
          display: block;
          font-size: var(--font-size-xs);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--color-primary);
          text-align: center;
          margin-bottom: 0.75rem;
        }

        .hiw-features-section {
          background: var(--color-bg-primary);
        }

        .hiw-steps-section {
          background: color-mix(in srgb, var(--color-muted) 50%, var(--color-bg-primary));
          border-top: 1px solid var(--color-border);
          border-bottom: 1px solid var(--color-border);
        }

        .hiw-section-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--color-text-primary);
          text-align: center;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .hiw-section-desc {
          font-size: var(--font-size-lg);
          color: var(--color-text-muted);
          text-align: center;
          margin-bottom: 3.5rem;
        }

        /* ── Features grid (bento style) ── */
        .hiw-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--color-border);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }

        .hiw-feature-card {
          padding: 2rem;
          background: var(--color-bg-primary);
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          transition: background var(--transition-base);
        }

        .hiw-feature-card:hover {
          background: color-mix(in srgb, var(--color-muted) 60%, var(--color-bg-primary));
        }

        .hiw-feature-icon {
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

        .hiw-feature-card:hover .hiw-feature-icon {
          background: var(--color-primary);
          color: white;
        }

        .hiw-feature-title {
          font-size: var(--font-size-base);
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 0.35rem;
        }

        .hiw-feature-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: 1.6;
        }

        /* ── Steps (editorial numbers) ── */
        .hiw-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
        }

        .hiw-step {
          position: relative;
          padding: 2rem 1.5rem;
          text-align: left;
        }

        .hiw-step-header {
          position: relative;
          height: 5rem;
          margin-bottom: 1.25rem;
          overflow: hidden;
        }

        .hiw-step-number-bg {
          font-size: 6rem;
          font-weight: 900;
          color: color-mix(in srgb, var(--color-primary) 20%, transparent);
          line-height: 1;
          position: absolute;
          top: -0.5rem;
          left: -0.25rem;
          letter-spacing: -0.05em;
          user-select: none;
        }

        .hiw-step-number {
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

        .hiw-step:hover .hiw-step-number {
          background: var(--color-primary);
          color: white;
        }

        .hiw-step-connector {
          position: absolute;
          top: 3.25rem;
          right: -1rem;
          width: 2rem;
          height: 2px;
          background: var(--color-border);
          z-index: 2;
        }

        .hiw-step-content {
          position: relative;
        }

        .hiw-step-title {
          font-size: var(--font-size-base);
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 0.5rem;
        }

        .hiw-step-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: 1.65;
        }

        /* ── CTA (solid bg, no gradient) ── */
        .hiw-cta {
          background: var(--color-primary);
          padding: 5rem 0;
          position: relative;
          overflow: hidden;
        }

        .hiw-cta-circle {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          top: -250px;
          right: -100px;
          background: white;
          pointer-events: none;
        }

        .hiw-cta-inner {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          position: relative;
          z-index: 1;
        }

        .hiw-cta-title {
          font-size: 2.75rem;
          font-weight: 800;
          color: white;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .hiw-cta-desc {
          font-size: var(--font-size-lg);
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .hiw-cta .btn-primary,
        .hiw-cta [class*="primary"] {
          background: white !important;
          color: var(--color-primary) !important;
          border-color: white !important;
        }

        .hiw-cta .btn-primary:hover,
        .hiw-cta [class*="primary"]:hover {
          box-shadow: 0 4px 24px rgba(255, 255, 255, 0.15) !important;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .hiw-features-grid { grid-template-columns: repeat(2, 1fr); }
          .hiw-steps {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }
          .hiw-step-connector { display: none; }
        }

        @media (max-width: 640px) {
          .hiw-hero { padding: 5rem var(--space-md) 4rem; }
          .hiw-hero-title { font-size: 2.75rem; }
          .hiw-features-grid { grid-template-columns: 1fr; }
          .hiw-steps { grid-template-columns: 1fr; }
          .hiw-section { padding: 3.5rem 0; }
          .hiw-cta-title { font-size: 2rem; }
          .hiw-step { padding: 1.5rem 1rem; }
        }
      `}</style>
    </div>
  )
}

export default HowItWorks
