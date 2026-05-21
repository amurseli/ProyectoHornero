import { useNavigate } from 'react-router-dom'
import { Button } from '$components/ui'

function CTASection() {
  const navigate = useNavigate()

  return (
    <section className="cta-section">
      <div className="cta-content">
        <h2 className="cta-title">¿Tenés una idea que vale la pena?</h2>
        <p className="cta-description">
          Creá tu campaña en minutos y empezá a recibir apoyo de la comunidad.
        </p>
        <Button variant="primary" size="lg" onClick={() => navigate('/for-creators')}>
          Crear campaña
        </Button>
      </div>

      <style>{`
        .cta-section {
          width: 100%;
          background: linear-gradient(to left,
            color-mix(in srgb, var(--color-primary) 10%, transparent),
            color-mix(in srgb, var(--color-secondary) 10%, transparent),
            color-mix(in srgb, var(--color-accent) 10%, transparent)
          );
          border-top: 1px solid var(--color-border);
          padding: 4rem 0;
        }

        .cta-content {
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 0 var(--space-xl);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }

        .cta-title {
          font-size: 2.5rem;
          font-weight: 700;
          background: var(--gradient-warm);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
          margin: 0;
        }

        .cta-description {
          font-size: var(--font-size-lg);
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin: 0;
        }

        @media (max-width: 768px) {
          .cta-section {
            padding: var(--space-xl) 0;
          }
          .cta-content {
            padding: 0 var(--space-md);
          }
          .cta-title {
            font-size: var(--font-size-2xl);
          }
          .cta-description {
            font-size: var(--font-size-base);
          }
        }
      `}</style>
    </section>
  )
}

export default CTASection