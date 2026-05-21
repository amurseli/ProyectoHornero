import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi"
import CampaignCard from "./CampaignCard"

function PaginationControls({ page, totalPages, totalElements, onPrev, onNext }) {
  if (totalPages <= 1) return null
  return (
    <div className="search-grid-pagination">
      <button
        type="button"
        className="search-grid-page-btn"
        onClick={onPrev}
        disabled={page <= 1}
        aria-label="Página anterior"
      >
        <FiChevronLeft />
      </button>
      <span className="search-grid-page-info">
        Página {page} de {totalPages}
        {totalElements > 0 && <span className="search-grid-page-count"> · {totalElements} resultados</span>}
      </span>
      <button
        type="button"
        className="search-grid-page-btn"
        onClick={onNext}
        disabled={page >= totalPages}
        aria-label="Página siguiente"
      >
        <FiChevronRight />
      </button>
    </div>
  )
}

function SearchResultsGrid({
  results,
  page,
  totalPages,
  totalElements,
  isLoading,
  query,
  selectedCategory,
  onPrev,
  onNext,
}) {
  const headerLabel = selectedCategory
    ? `Resultados en "${selectedCategory.name}"`
    : query
      ? `Resultados para "${query}"`
      : "Resultados"

  const showEmpty = !isLoading && results.length === 0
  const showInitialLoading = isLoading && results.length === 0

  return (
    <section className="search-grid-section">
      <div className="search-grid-header">
        <h2 className="search-grid-title">
          <FiSearch className="search-grid-title-icon" />
          {headerLabel}
        </h2>
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          onPrev={onPrev}
          onNext={onNext}
        />
      </div>

      {showInitialLoading ? (
        <div className="search-grid-status">
          <div className="search-grid-spinner" />
          <p>Buscando campañas...</p>
        </div>
      ) : showEmpty ? (
        <div className="search-grid-status">
          <p>No se encontraron campañas. Probá con otra categoría o con otro título.</p>
        </div>
      ) : (
        <>
          <div className={`search-grid ${isLoading ? "is-loading" : ""}`}>
            {results.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} variant="featured" />
            ))}
          </div>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            onPrev={onPrev}
            onNext={onNext}
          />
        </>
      )}

      <style>{styles}</style>
    </section>
  )
}

const styles = `
  .search-grid-section {
    margin-bottom: 3rem;
  }

  .search-grid-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .search-grid-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    gap: 0.625rem;
    margin: 0;
  }

  .search-grid-title-icon {
    width: 1.375rem;
    height: 1.375rem;
    color: var(--color-primary);
  }

  .search-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
    transition: opacity 0.2s ease;
  }

  .search-grid.is-loading {
    opacity: 0.55;
  }

  @media (max-width: 1024px) {
    .search-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .search-grid {
      grid-template-columns: 1fr;
    }
  }

  .search-grid-pagination {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.875rem;
    background: white;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 9999px;
    box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
  }

  .search-grid-section > .search-grid-pagination {
    display: flex;
    justify-content: center;
    margin: 1.75rem auto 0;
    width: fit-content;
  }

  .search-grid-page-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--color-border, #e5e7eb);
    background: white;
    color: var(--color-text-primary, #111827);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .search-grid-page-btn:hover:not(:disabled) {
    border-color: var(--color-primary, #d94f30);
    color: var(--color-primary, #d94f30);
  }

  .search-grid-page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .search-grid-page-info {
    font-size: 0.875rem;
    color: var(--color-text-primary, #111827);
    font-weight: 600;
    white-space: nowrap;
  }

  .search-grid-page-count {
    color: var(--color-text-muted, #6b7280);
    font-weight: 500;
  }

  .search-grid-status {
    padding: 3rem 1.25rem;
    text-align: center;
    color: var(--color-text-muted, #6b7280);
    background: var(--color-muted, #f9fafb);
    border-radius: var(--radius-lg, 0.75rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .search-grid-spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid var(--color-border, #e5e7eb);
    border-top-color: var(--color-primary, #d94f30);
    border-radius: 50%;
    animation: search-grid-spin 0.8s linear infinite;
  }

  @keyframes search-grid-spin {
    to { transform: rotate(360deg); }
  }
`

export default SearchResultsGrid
