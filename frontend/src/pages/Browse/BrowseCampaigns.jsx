import { useEffect, useRef } from "react"
import { useBrowseCampaigns } from "../../hooks/useBrowseCampaigns"
import { CampaignCard } from "$components/features"


const STATUS_OPTIONS = [
  { value: "CROWDFUNDING", label: "En curso" },
  { value: "FUNDED",       label: "Financiadas" },
  { value: "FAILED",       label: "No alcanzadas" },
]

const SORT_OPTIONS = [
  { value: "recent", label: "Más recientes" },
  { value: "funded", label: "Más financiadas" },
  { value: "ending", label: "Por vencer" },
]

function BrowseCampaigns() {
  const {
    campaigns, isLoading, isLoadingMore, totalElements,
    categories, loadMore,
  } = useBrowseCampaigns()

  const sentinelRef = useRef(null)
  const loadMoreRef = useRef(loadMore)
  useEffect(() => { loadMoreRef.current = loadMore }, [loadMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMoreRef.current() },
      { rootMargin: "200px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1 className="browse-title">Explorar campañas</h1>
        {!isLoading && (
          <p className="browse-count">{totalElements} proyecto{totalElements !== 1 ? "s" : ""}</p>
        )}
      </div>

      <div className="browse-filters browse-filters--disabled">
        <div className="browse-filter-group">
          <span className="browse-filter-label">Categoría</span>
          <div className="browse-chips">
            <button disabled className="browse-chip browse-chip--active">Todas</button>
            {categories.map(cat => (
              <button key={cat.id} disabled className="browse-chip">{cat.name}</button>
            ))}
          </div>
        </div>

        <div className="browse-filter-group">
          <span className="browse-filter-label">Estado</span>
          <div className="browse-chips">
            <button disabled className="browse-chip browse-chip--active">Todos</button>
            {STATUS_OPTIONS.map(opt => (
              <button key={opt.value} disabled className="browse-chip">{opt.label}</button>
            ))}
          </div>
        </div>

        <div className="browse-filter-group">
          <span className="browse-filter-label">Ordenar</span>
          <div className="browse-chips">
            {SORT_OPTIONS.map(opt => (
              <button key={opt.value} disabled className="browse-chip">{opt.label}</button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="browse-grid">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="browse-skeleton" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="browse-empty">
          <p>No hay campañas que coincidan con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="browse-grid">
          {campaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} variant="standard" />
          ))}
        </div>
      )}

      {isLoadingMore && (
        <div className="browse-loading-more">
          <div className="loading-spinner" />
        </div>
      )}

      {!isLoading && <div ref={sentinelRef} className="browse-sentinel" />}

      <style>{`
        .browse-page {
          max-width: var(--max-width);
          margin: 0 auto;
          padding: var(--space-xl) var(--space-xl) var(--space-2xl);
        }

        .browse-header {
          display: flex;
          align-items: baseline;
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
        }

        .browse-title {
          font-size: var(--font-size-3xl);
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
        }

        .browse-count {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin: 0;
        }

        .browse-filters {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-xl);
          border-bottom: 1px solid var(--color-border);
        }

        .browse-filter-group {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex-wrap: wrap;
        }

        .browse-filter-label {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-text-secondary);
          min-width: 6rem;
          flex-shrink: 0;
        }

        .browse-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .browse-chip {
          padding: 0.35rem 0.9rem;
          border-radius: 999px;
          border: 1px solid var(--color-border);
          background: transparent;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.15s;
          font-family: var(--font-sans);
        }

        .browse-chip:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        .browse-chip--active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #fff;
        }

        .browse-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-lg);
        }

        .browse-skeleton {
          height: 320px;
          border-radius: var(--radius-lg);
          background: linear-gradient(90deg, var(--color-surface) 25%, #e8e1db 50%, var(--color-surface) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .browse-empty {
          text-align: center;
          padding: var(--space-2xl) 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-lg);
        }

        .browse-loading-more {
          display: flex;
          justify-content: center;
          padding: var(--space-xl) 0;
        }

        .browse-sentinel {
          height: 1px;
        }

        @media (max-width: 1024px) {
          .browse-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .browse-page { padding: var(--space-lg) var(--space-md) var(--space-xl); }
          .browse-grid { grid-template-columns: 1fr; }
          .browse-filter-group { flex-direction: column; align-items: flex-start; }
          .browse-filter-label { min-width: auto; }
        }
      `}</style>
    </div>
  )
}

export default BrowseCampaigns
