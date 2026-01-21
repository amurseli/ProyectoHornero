import { CategoryTabs } from "../../../components/features"

function HeroSection({ activeTab, onTabChange }) {
  return (
    <section className="hero-section">
      <div className="container hero-container">
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
          background: linear-gradient(to right, 
            rgba(236, 72, 153, 0.1), 
            rgba(139, 92, 246, 0.1), 
            rgba(56, 189, 248, 0.1)
          );
          border-bottom: 1px solid var(--color-border);
        }

        .hero-container {
          padding-top: 3rem;
          padding-bottom: 3rem;
        }

        .hero-content {
          max-width: 48rem;
          margin: 0 auto 2rem;
          text-align: center;
        }

        .hero-title {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
          text-balance: balance;
        }

        @media (min-width: 768px) {
          .hero-title {
            font-size: 3rem;
          }
        }

        .hero-description {
          font-size: 1.125rem;
          color: var(--color-muted-foreground);
        }
      `}</style>
    </section>
  )
}

export default HeroSection
