import { CategoryTabs } from "../../../components/features"

function HeroSection({ activeTab, onTabChange }) {
  return (
    <section className="hero-section">
      <div className="hero-content-wrapper">
        <div className="hero-content">
          <h1 className="hero-title">Haz realidad un proyecto creativo</h1>
          <p className="hero-description">
            Explora miles de proyectos innovadores y apoya a creadores de todo el mundo
          </p>
        </div>

        <CategoryTabs activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      <style>{`
        .hero-section {
          width: 100%;
          background: linear-gradient(to right, 
            color-mix(in srgb, var(--color-primary) 10%, transparent),
            color-mix(in srgb, var(--color-secondary) 10%, transparent),
            color-mix(in srgb, var(--color-accent) 10%, transparent)
          );
          border-bottom: 1px solid var(--color-border);
          padding: 3rem 0;
        }

        .hero-content-wrapper {
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 0 var(--space-xl);
        }

        .hero-content {
          max-width: 48rem;
          margin: 0 auto 2rem;
          text-align: center;
        }

        .hero-title {
          font-size: var(--font-size-3xl);
          font-weight: 700;
          background: var(--gradient-warm);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--space-md);
          line-height: 1.2;
        }

        @media (min-width: 768px) {
          .hero-title {
            font-size: 3rem;
          }
        }

        .hero-description {
          font-size: var(--font-size-lg);
          color: var(--color-text-secondary);
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .hero-section {
            padding: var(--space-xl) 0;
          }

          .hero-content-wrapper {
            padding: 0 var(--space-md);
          }

          .hero-title {
            font-size: var(--font-size-2xl);
          }

          .hero-description {
            font-size: var(--font-size-base);
          }
        }
      `}</style>
    </section>
  )
}

export default HeroSection