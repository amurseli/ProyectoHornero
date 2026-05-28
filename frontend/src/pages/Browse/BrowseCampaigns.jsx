import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { FiSearch, FiChevronDown } from "react-icons/fi"
import { useBrowseCampaigns } from "../../hooks/useBrowseCampaigns"
import { CampaignCard } from "$components/features"


const STATUS_OPTIONS = [
  { value: "CROWDFUNDING", label: "En curso" },
  { value: "SUCCESSFUL",   label: "Financiadas" },
  { value: "FAILED",       label: "No alcanzadas" },
]

const SORT_OPTIONS = [
  { value: "recent", label: "Más recientes" },
  { value: "funded", label: "Más financiadas" },
  { value: "ending", label: "Por vencer" },
]

function BrowseCampaigns() {
  const [searchParams, setSearchParams] = useSearchParams()

  const initialFilters = useMemo(() => ({
    search: searchParams.get("search") || "",
    categoryId: searchParams.get("categoryId"),
    status: searchParams.get("status"),
    sort: searchParams.get("sort") || "recent",
  }), [])

  const {
    campaigns, isLoading, isLoadingMore, hasMore, totalElements,
    categories, loadMore,
    selectedCategory, selectedStatus, selectedSort,
    searchInput, search, setSearchInput, setSearch, commitSearch,
    toggleCategory, setStatus, setSort,
    clearCategory, clearStatus,
    selectCategory, selectStatus, selectSort,
  } = useBrowseCampaigns(initialFilters)

  // Tracks the most-recent URL query string this component is aware of, used to
  // distinguish "we just wrote the URL" from "URL changed from external navigation".
  const lastParamsRef = useRef(searchParams.toString())

  // Push the full filter state (search + category + status + sort) back to the URL
  // so every applied filter is reflected in the address bar and survives a reload.
  useEffect(() => {
    const current = searchParams.toString()
    // If the URL was just changed from outside (e.g. navbar's "Ver los N Proyectos"
    // landed here, or back/forward), let the URL→state sync absorb it instead of
    // overwriting the incoming params with the still-stale state.
    if (current !== lastParamsRef.current) return

    const next = new URLSearchParams()
    if (search) next.set("search", search)
    if (selectedCategory?.id != null) next.set("categoryId", String(selectedCategory.id))
    if (selectedStatus) next.set("status", selectedStatus)
    if (selectedSort && selectedSort !== "recent") next.set("sort", selectedSort)

    const desired = next.toString()
    if (desired === current) return

    lastParamsRef.current = desired
    setSearchParams(next, { replace: true })
  }, [search, selectedCategory, selectedStatus, selectedSort, searchParams, setSearchParams])

  // After the first manual "Cargar Más" click, subsequent pages auto-load on scroll.
  // Resets whenever the filters change (which restarts the campaign list).
  const [autoLoad, setAutoLoad] = useState(false)
  useEffect(() => {
    setAutoLoad(false)
  }, [selectedCategory, selectedStatus, selectedSort, search])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    commitSearch()
  }

  // Clicking any other filter chip also commits the current search text,
  // so typed-but-not-yet-Entered text is preserved + applied alongside the chip change.
  const handleToggleCategory = (cat) => { commitSearch(); toggleCategory(cat) }
  const handleClearCategory  = () => { commitSearch(); clearCategory() }
  const handleSetStatus      = (status) => { commitSearch(); setStatus(status) }
  const handleClearStatus    = () => { commitSearch(); clearStatus() }
  const handleSetSort        = (sort) => { commitSearch(); setSort(sort) }

  const handleLoadMore = () => {
    setAutoLoad(true)
    loadMore()
  }

  const sentinelRef = useRef(null)
  const loadMoreRef = useRef(loadMore)
  useEffect(() => { loadMoreRef.current = loadMore }, [loadMore])

  useEffect(() => {
    if (!autoLoad || !hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMoreRef.current() },
      { rootMargin: "200px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [autoLoad, hasMore, campaigns.length])

  // Sync URL params → hook state when the URL changes from external navigation
  // (e.g. clicking "Ver los N Proyectos" in the navbar while already on /explorar).
  useEffect(() => {
    const current = searchParams.toString()
    if (current === lastParamsRef.current) return

    const urlCategoryId = searchParams.get("categoryId")
    // If the URL needs a category but categories haven't loaded yet, wait.
    if (urlCategoryId != null && categories.length === 0) return

    lastParamsRef.current = current

    const urlSearch = searchParams.get("search") || ""
    setSearchInput(urlSearch)
    setSearch(urlSearch)
    selectStatus(searchParams.get("status") || null)
    selectSort(searchParams.get("sort") || "recent")
    if (urlCategoryId == null) {
      selectCategory(null)
    } else {
      const cat = categories.find(c => String(c.id) === String(urlCategoryId))
      selectCategory(cat || null)
    }
  }, [searchParams, categories, setSearchInput, setSearch, selectCategory, selectStatus, selectSort])

  return (
    <div className="browse-page">
      <div className="browse-filters">
        <form className="browse-search-row" onSubmit={handleSearchSubmit}>
          <FiSearch className="browse-search-icon" />
          <input
            type="text"
            className="browse-search-input"
            placeholder="Buscar por título y presioná Enter..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        <div className="browse-filter-group">
          <span className="browse-filter-label">Categoría</span>
          <div className="browse-chips">
            <button
              type="button"
              className={`browse-chip ${selectedCategory == null ? "browse-chip--active" : ""}`}
              onClick={handleClearCategory}
            >
              Todas
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`browse-chip ${selectedCategory?.id === cat.id ? "browse-chip--active" : ""}`}
                onClick={() => handleToggleCategory(cat)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="browse-filter-group">
          <span className="browse-filter-label">Estado</span>
          <div className="browse-chips">
            <button
              type="button"
              className={`browse-chip ${selectedStatus == null ? "browse-chip--active" : ""}`}
              onClick={handleClearStatus}
            >
              Todos
            </button>
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`browse-chip ${selectedStatus === opt.value ? "browse-chip--active" : ""}`}
                onClick={() => handleSetStatus(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="browse-filter-group">
          <span className="browse-filter-label">Ordenar</span>
          <div className="browse-chips">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`browse-chip ${selectedSort === opt.value ? "browse-chip--active" : ""}`}
                onClick={() => handleSetSort(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="browse-header">
        <h1 className="browse-title">
          Explorar <span className="browse-title-count">{totalElements} Proyecto{totalElements !== 1 ? "s" : ""}</span>
        </h1>
      </div>

      {(() => {
        const filterKey = `${search}|${selectedCategory?.id ?? ""}|${selectedStatus ?? ""}|${selectedSort}`
        if (isLoading) {
          return (
            <div key={`loading:${filterKey}`} className="browse-grid browse-grid--enter">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="browse-skeleton" />
              ))}
            </div>
          )
        }
        if (campaigns.length === 0) {
          return (
            <div key={`empty:${filterKey}`} className="browse-empty browse-grid--enter">
              <p>No hay campañas que coincidan con los filtros seleccionados.</p>
            </div>
          )
        }
        return (
          <div key={`results:${filterKey}`} className="browse-grid browse-grid--enter">
            {campaigns.map((campaign, i) => (
              <div
                key={campaign.id}
                className="browse-card-enter"
                style={{ animationDelay: `${Math.min(i, 11) * 30}ms` }}
              >
                <CampaignCard campaign={campaign} variant="standard" />
              </div>
            ))}
          </div>
        )
      })()}

      {!isLoading && hasMore && campaigns.length > 0 && (
        autoLoad ? (
          <div className="browse-load-more-wrap">
            {isLoadingMore && (
              <div className="browse-load-more-status">
                <span className="browse-load-more-spinner" />
                Cargando...
              </div>
            )}
            <div ref={sentinelRef} className="browse-sentinel" />
          </div>
        ) : (
          <div className="browse-load-more-wrap">
            <button
              type="button"
              className="browse-load-more"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <span className="browse-load-more-spinner" />
                  Cargando...
                </>
              ) : (
                <>
                  Cargar Más
                  <FiChevronDown className="browse-load-more-icon" />
                </>
              )}
            </button>
          </div>
        )
      )}

      <style>{`
        .browse-page {
          max-width: var(--max-width);
          margin: 0 auto;
          padding: var(--space-xl) var(--space-xl) var(--space-2xl);
        }

        .browse-filters {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--color-border);
        }

        .browse-search-row {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          width: 100%;
          background: var(--color-muted, #f3f4f6);
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: var(--radius-full, 9999px);
          padding: 0.625rem 1rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .browse-search-row:focus-within {
          background: white;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
        }

        .browse-search-icon {
          width: 1.125rem;
          height: 1.125rem;
          color: var(--color-text-muted, #6b7280);
          flex-shrink: 0;
        }

        .browse-search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.95rem;
          color: var(--color-text-primary);
          min-width: 0;
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

        .browse-chip--active:hover {
          color: #fff;
        }

        .browse-header {
          margin-bottom: var(--space-lg);
        }

        .browse-title {
          font-size: var(--font-size-3xl);
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
        }

        .browse-title-count {
          color: var(--color-primary);
        }

        .browse-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-lg);
        }

        .browse-grid--enter {
          animation: browse-fade-in 0.3s ease;
        }

        @keyframes browse-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .browse-card-enter {
          animation: browse-card-in 0.45s ease backwards;
        }

        @keyframes browse-card-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
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

        .browse-load-more-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-xl) 0 0;
        }

        .browse-load-more-status {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .browse-sentinel {
          height: 1px;
          width: 100%;
        }

        .browse-load-more {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 2rem;
          border-radius: 999px;
          border: 1px solid var(--color-primary);
          background: transparent;
          color: var(--color-primary);
          font-size: var(--font-size-sm);
          font-weight: 600;
          font-family: var(--font-sans);
          cursor: pointer;
          transition: background 0.15s, color 0.15s, transform 0.15s;
        }

        .browse-load-more:hover:not(:disabled) {
          background: var(--color-primary);
          color: #fff;
        }

        .browse-load-more:disabled {
          opacity: 0.6;
          cursor: progress;
        }

        .browse-load-more-icon {
          width: 1rem;
          height: 1rem;
        }

        .browse-load-more-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: browse-load-more-spin 0.8s linear infinite;
        }

        @keyframes browse-load-more-spin {
          to { transform: rotate(360deg); }
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
