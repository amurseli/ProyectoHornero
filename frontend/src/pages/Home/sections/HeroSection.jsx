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
            rgba(236, 72, 153, 0.1), 
            rgba(139, 92, 246, 0.1), 
            rgba(56, 189, 248, 0.1)
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
          font-size: 2.5rem;
          font-weight: 700;
          background: var(--gradient-warm);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        @media (min-width: 768px) {
          .hero-title {
            font-size: 3rem;
          }
        }

        .hero-description {
          font-size: 1.125rem;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .hero-section {
            padding: 2rem 0;
          }

          .hero-content-wrapper {
            padding: 0 var(--space-md);
          }

          .hero-title {
            font-size: 2rem;
          }

          .hero-description {
            font-size: 1rem;
          }
        }
      `}</style>
    </section>
  )
}

export default HeroSection