import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiSearch,
  FiX,
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
} from "react-icons/fi"
import ReactPlayer from "react-player"
import { useCampaignSearch } from "../../hooks/useCampaignSearch"

const VIDEO_DELAY_MS = 1000

function SearchResultRow({ campaign, showCategory, onMouseEnter, onMouseLeave, onClick }) {
  const goal = campaign.goal || campaign.targetAmount || 0
  const raised = campaign.currentAmount ?? campaign.raised ?? 0
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0

  return (
    <div
      className="navsearch-row"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {showCategory && (
        <span className="navsearch-row-category">{campaign.category}</span>
      )}
      <div className="navsearch-row-main">
        <h4 className="navsearch-row-title">{campaign.title}</h4>
        <div className="navsearch-row-bar">
          <div className="navsearch-row-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="navsearch-row-goal">
        <p className="navsearch-row-goal-value">${Number(goal).toLocaleString()}</p>
        <p className="navsearch-row-goal-label">meta</p>
      </div>
    </div>
  )
}

function CampaignPreview({ campaign }) {
  const [videoActive, setVideoActive] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const goal = campaign.goal || campaign.targetAmount || 0
  const raised = campaign.currentAmount ?? campaign.raised ?? 0
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0
  const daysLeft = campaign.daysLeft ?? 0
  const videoUrl = campaign.videoUrl || null

  // Restart the 3-second timer whenever the previewed campaign changes
  useEffect(() => {
    setVideoActive(false)
    setVideoReady(false)
    if (!videoUrl) return
    const timer = setTimeout(() => setVideoActive(true), VIDEO_DELAY_MS)
    return () => clearTimeout(timer)
  }, [campaign.id, videoUrl])

  return (
    <div className="navsearch-preview">
      <div className="navsearch-preview-thumb">
        <img
          src={campaign.imageUrl || "/crowdfunding-campaign.jpg"}
          alt={campaign.title}
          className="navsearch-preview-image"
        />
        {videoActive && videoUrl && (
          <div className={`navsearch-preview-video ${videoReady ? "is-visible" : ""}`}>
            <ReactPlayer
              src={videoUrl}
              playing
              muted
              loop
              width="100%"
              height="100%"
              onReady={() => setVideoReady(true)}
              config={{
                youtube: { playerVars: { controls: 0, modestbranding: 1, rel: 0 } },
                vimeo: { playerOptions: { controls: false } },
              }}
            />
          </div>
        )}
        {campaign.category && (
          <span className="navsearch-preview-badge">{campaign.category}</span>
        )}
      </div>
      <div className="navsearch-preview-body">
        <h3 className="navsearch-preview-title">{campaign.title}</h3>
        {campaign.shortDescription && (
          <p className="navsearch-preview-desc">{campaign.shortDescription}</p>
        )}
        <div className="navsearch-preview-bar">
          <div className="navsearch-preview-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="navsearch-preview-stats">
          <div>
            <p className="navsearch-preview-stat-value">${Number(raised).toLocaleString()}</p>
            <p className="navsearch-preview-stat-label">de ${Number(goal).toLocaleString()} meta</p>
          </div>
          <div className="navsearch-preview-stat-right">
            <p className="navsearch-preview-stat-value">
              <FiCalendar className="navsearch-preview-icon" />
              {daysLeft > 0 ? `${daysLeft} días` : "Finalizada"}
            </p>
            <p className="navsearch-preview-stat-label">{daysLeft > 0 ? "restantes" : ""}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function NavbarSearchBar() {
  const navigate = useNavigate()
  const search = useCampaignSearch()
  const {
    query,
    selectedCategory,
    categories,
    page,
    results,
    totalPages,
    totalElements,
    isLoading,
    hasActiveQuery,
    setQuery,
    toggleCategory,
    clearCategory,
    goNext,
    goPrev,
  } = search

  const [isOpen, setIsOpen] = useState(false)
  const [hoveredCampaign, setHoveredCampaign] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
        setHoveredCampaign(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelectCampaign = (campaign) => {
    setIsOpen(false)
    setHoveredCampaign(null)
    navigate(`/campaigns/${campaign.id}`)
  }

  return (
    <div className="navsearch" ref={containerRef}>
      <div className="navsearch-input-wrapper">
        <FiSearch className="navsearch-input-icon" />
        {selectedCategory && (
          <span className="navsearch-selected-tag">
            {selectedCategory.name}
            <button
              type="button"
              className="navsearch-selected-tag-x"
              onClick={(e) => { e.stopPropagation(); clearCategory() }}
              aria-label="Quitar filtro"
            >
              <FiX />
            </button>
          </span>
        )}
        <input
          type="text"
          className="navsearch-input"
          placeholder="Buscar campañas..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
          aria-label="Buscar proyectos"
        />
        {isLoading && (
          <FiLoader className="navsearch-input-loading" aria-label="Cargando" />
        )}
      </div>

      {isOpen && (
        <div className="navsearch-dropdown">
          {categories.length > 0 && (
            <div className="navsearch-tags">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`navsearch-tag ${selectedCategory?.id === cat.id ? "active" : ""}`}
                  onClick={() => { toggleCategory(cat); setIsOpen(true) }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {hasActiveQuery && (
            <>
              {!isLoading && results.length === 0 ? (
                <div className="navsearch-empty">
                  No se encontraron campañas. Probá con otra categoría o con otro título.
                </div>
              ) : results.length === 0 && isLoading ? (
                <div className="navsearch-empty">Buscando...</div>
              ) : (
                <>
                  <ul className="navsearch-results">
                    {results.map((campaign) => (
                      <li key={campaign.id} className="navsearch-results-item">
                        <SearchResultRow
                          campaign={campaign}
                          showCategory={selectedCategory == null}
                          onMouseEnter={() => setHoveredCampaign(campaign)}
                          onMouseLeave={() => setHoveredCampaign((c) => (c?.id === campaign.id ? null : c))}
                          onClick={() => handleSelectCampaign(campaign)}
                        />
                      </li>
                    ))}
                  </ul>

                  {totalPages > 1 && (
                    <div className="navsearch-pagination">
                      <button
                        type="button"
                        className="navsearch-pagination-btn"
                        onClick={goPrev}
                        disabled={page <= 1}
                        aria-label="Página anterior"
                      >
                        <FiChevronLeft />
                      </button>
                      <span className="navsearch-pagination-info">
                        Página {page} de {totalPages}
                        {totalElements > 0 && ` · ${totalElements}`}
                      </span>
                      <button
                        type="button"
                        className="navsearch-pagination-btn"
                        onClick={goNext}
                        disabled={page >= totalPages}
                        aria-label="Página siguiente"
                      >
                        <FiChevronRight />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {!hasActiveQuery && (
            <div className="navsearch-empty navsearch-empty--hint">
              Escribí algo o elegí una categoría para buscar campañas.
            </div>
          )}

        </div>
      )}

      {isOpen && hoveredCampaign && (
        <div className="navsearch-preview-wrapper">
          <CampaignPreview campaign={hoveredCampaign} />
        </div>
      )}

      <style>{styles}</style>
    </div>
  )
}

const styles = `
  .navsearch {
    display: none;
    position: relative;
    flex: 1;
    max-width: 32rem;
    margin: 0 1.5rem;
  }

  @media (min-width: 768px) {
    .navsearch {
      display: flex;
    }
  }

  .navsearch-input-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    background: var(--color-muted, #f3f4f6);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: var(--radius-full, 9999px);
    padding: 0.5rem 0.875rem;
    transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .navsearch-input-wrapper:focus-within {
    background: white;
    border-color: var(--color-primary, #d94f30);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #d94f30) 15%, transparent);
  }

  .navsearch-input-icon {
    width: 1.125rem;
    height: 1.125rem;
    color: var(--color-text-muted, #6b7280);
    flex-shrink: 0;
  }

  .navsearch-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.9375rem;
    color: var(--color-text-primary, #111827);
    min-width: 0;
  }

  .navsearch-input::placeholder {
    color: var(--color-muted-foreground, #9ca3af);
  }

  .navsearch-selected-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    background: var(--color-primary, #d94f30);
    color: white;
    padding: 0.2rem 0.55rem;
    border-radius: var(--radius-full, 9999px);
    font-size: 0.8rem;
    font-weight: 600;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .navsearch-selected-tag-x {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 50%;
    width: 1rem;
    height: 1rem;
    cursor: pointer;
    padding: 0;
  }

  .navsearch-selected-tag-x:hover {
    background: rgba(255, 255, 255, 0.4);
  }

  .navsearch-input-loading {
    width: 1.125rem;
    height: 1.125rem;
    color: var(--color-primary, #d94f30);
    flex-shrink: 0;
    animation: navsearch-spin 0.8s linear infinite;
  }

  @keyframes navsearch-spin {
    to { transform: rotate(360deg); }
  }

  .navsearch-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    background: white;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: var(--radius-lg, 0.75rem);
    box-shadow: var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.1));
    z-index: 60;
    max-height: 32rem;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .navsearch-tags {
    display: flex;
    gap: 0.375rem;
    flex-wrap: wrap;
    padding: 0.625rem 0.75rem;
    border-bottom: 1px solid var(--color-border, #f3f4f6);
  }

  .navsearch-tag {
    padding: 0.3rem 0.75rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 9999px;
    background: white;
    color: var(--color-foreground, #374151);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .navsearch-tag:hover {
    background: var(--color-muted, #f9fafb);
    border-color: var(--color-primary, #d94f30);
  }

  .navsearch-tag.active {
    background: var(--color-primary, #d94f30);
    color: white;
    border-color: var(--color-primary, #d94f30);
  }

  .navsearch-empty {
    padding: 1.75rem 1rem;
    text-align: center;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
  }

  .navsearch-empty--hint {
    padding: 1.25rem 1rem;
    color: var(--color-muted-foreground, #9ca3af);
  }

  .navsearch-results {
    list-style: none;
    margin: 0;
    padding: 0.25rem;
    overflow-y: auto;
    max-height: 22rem;
  }

  .navsearch-results-item + .navsearch-results-item {
    border-top: 1px solid var(--color-border, #f3f4f6);
  }

  /* Row uses a primary-tinted hover so it stays distinct from the grey progress track */
  .navsearch-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    border-radius: var(--radius-md, 0.5rem);
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .navsearch-row:hover {
    background: color-mix(in srgb, var(--color-primary, #d94f30) 10%, white);
  }

  .navsearch-row-category {
    flex-shrink: 0;
    padding: 0.2rem 0.55rem;
    background: color-mix(in srgb, var(--color-primary, #d94f30) 15%, transparent);
    color: var(--color-primary, #d94f30);
    border-radius: var(--radius-full, 9999px);
    font-size: 0.7rem;
    font-weight: 600;
    min-width: 5rem;
    text-align: center;
  }

  .navsearch-row-main {
    flex: 1;
    min-width: 0;
  }

  .navsearch-row-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary, #111827);
    margin: 0 0 0.375rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .navsearch-row-bar {
    width: 100%;
    height: 0.375rem;
    background: #d1d5db;
    border-radius: 9999px;
    overflow: hidden;
  }

  .navsearch-row-bar-fill {
    height: 100%;
    background: var(--gradient-progress, linear-gradient(to right, #f59e0b, #d94f30));
    border-radius: 9999px;
    transition: width 0.4s ease;
  }

  .navsearch-row-goal {
    flex-shrink: 0;
    text-align: right;
  }

  .navsearch-row-goal-value {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-text-primary, #111827);
    margin: 0;
  }

  .navsearch-row-goal-label {
    font-size: 0.7rem;
    color: var(--color-text-muted, #6b7280);
    margin: 0;
  }

  .navsearch-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    padding: 0.5rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
  }

  .navsearch-pagination-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.875rem;
    height: 1.875rem;
    border: 1px solid var(--color-border, #e5e7eb);
    background: white;
    color: var(--color-text-primary, #111827);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .navsearch-pagination-btn:hover:not(:disabled) {
    border-color: var(--color-primary, #d94f30);
    color: var(--color-primary, #d94f30);
  }

  .navsearch-pagination-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .navsearch-pagination-info {
    font-size: 0.8rem;
    color: var(--color-text-muted, #6b7280);
    font-weight: 500;
  }

  /* Hover preview to the right of the dropdown */
  .navsearch-preview-wrapper {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: calc(100% + 0.75rem);
    width: 22rem;
    pointer-events: none;
    z-index: 70;
  }

  @media (max-width: 1280px) {
    .navsearch-preview-wrapper {
      display: none;
    }
  }

  .navsearch-preview {
    background: white;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: var(--radius-lg, 0.75rem);
    overflow: hidden;
    box-shadow: var(--shadow-xl, 0 20px 40px rgba(0,0,0,0.15));
  }

  .navsearch-preview-thumb {
    position: relative;
    aspect-ratio: 16 / 9;
    background: var(--color-muted, #f3f4f6);
    overflow: hidden;
  }

  .navsearch-preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .navsearch-preview-video {
    position: absolute;
    inset: 0;
    z-index: 2;
    background: black;
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .navsearch-preview-video.is-visible {
    opacity: 1;
  }

  .navsearch-preview-badge {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    padding: 0.2rem 0.55rem;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text-primary, #111827);
    z-index: 3;
  }

  .navsearch-preview-body {
    padding: 0.875rem;
  }

  .navsearch-preview-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-text-primary, #111827);
    margin: 0 0 0.5rem;
    line-height: 1.3;
  }

  .navsearch-preview-desc {
    font-size: 0.8rem;
    color: var(--color-text-muted, #6b7280);
    margin: 0 0 0.625rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
  }

  .navsearch-preview-bar {
    width: 100%;
    height: 0.375rem;
    background: #d1d5db;
    border-radius: 9999px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .navsearch-preview-bar-fill {
    height: 100%;
    background: var(--gradient-progress, linear-gradient(to right, #f59e0b, #d94f30));
    border-radius: 9999px;
  }

  .navsearch-preview-stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .navsearch-preview-stat-right {
    text-align: right;
  }

  .navsearch-preview-stat-value {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-text-primary, #111827);
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .navsearch-preview-stat-label {
    font-size: 0.7rem;
    color: var(--color-text-muted, #6b7280);
    margin: 0;
  }

  .navsearch-preview-icon {
    width: 0.875rem;
    height: 0.875rem;
    color: var(--color-primary, #d94f30);
  }
`

export default NavbarSearchBar
