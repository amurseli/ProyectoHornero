import { FiSearch, FiX, FiLoader } from "react-icons/fi"

function SearchBar({ search }) {
  const {
    query,
    selectedCategory,
    categories,
    isLoading,
    setQuery,
    toggleCategory,
    clearCategory,
    submit,
  } = search

  const handleSubmit = (e) => {
    e.preventDefault()
    if (typeof submit === "function") submit()
  }

  return (
    <form className="search-bar-container" onSubmit={handleSubmit}>
      <div className="search-input-wrapper">
        <FiSearch className="search-input-icon" />
        {selectedCategory && (
          <span className="search-selected-tag">
            {selectedCategory.name}
            <button
              type="button"
              className="search-selected-tag-x"
              onClick={(e) => { e.stopPropagation(); clearCategory() }}
              aria-label="Quitar filtro"
            >
              <FiX />
            </button>
          </span>
        )}
        <input
          type="text"
          className="search-input"
          placeholder="Buscar campañas..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isLoading && (
          <FiLoader className="search-input-loading" aria-label="Cargando" />
        )}
      </div>

      {categories.length > 0 && (
        <div className="search-tags">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`search-tag ${selectedCategory?.id === cat.id ? "active" : ""}`}
              onClick={() => toggleCategory(cat)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <style>{styles}</style>
    </form>
  )
}

const styles = `
  .search-bar-container {
    position: relative;
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
  }

  .search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: white;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: var(--radius-full, 9999px);
    padding: 0.625rem 1rem;
    box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .search-input-wrapper:focus-within {
    border-color: var(--color-primary, #d94f30);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #d94f30) 15%, transparent);
  }

  .search-input-icon {
    width: 1.125rem;
    height: 1.125rem;
    color: var(--color-text-muted, #6b7280);
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.95rem;
    color: var(--color-text-primary, #111827);
    min-width: 0;
  }

  .search-input::placeholder {
    color: var(--color-text-muted, #9ca3af);
  }

  .search-selected-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    background: var(--color-primary, #d94f30);
    color: white;
    padding: 0.25rem 0.625rem;
    border-radius: var(--radius-full, 9999px);
    font-size: 0.8125rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  .search-selected-tag-x {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 50%;
    width: 1.125rem;
    height: 1.125rem;
    cursor: pointer;
    padding: 0;
  }

  .search-selected-tag-x:hover {
    background: rgba(255, 255, 255, 0.4);
  }

  .search-input-loading {
    width: 1.125rem;
    height: 1.125rem;
    color: var(--color-primary, #d94f30);
    flex-shrink: 0;
    animation: search-spin 0.8s linear infinite;
  }

  @keyframes search-spin {
    to { transform: rotate(360deg); }
  }

  .search-tags {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
    padding: 0.75rem 0 0;
  }

  .search-tag {
    padding: 0.4rem 1rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 9999px;
    background: white;
    color: var(--color-foreground, #374151);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .search-tag:hover {
    background: var(--color-muted, #f9fafb);
    border-color: var(--color-primary, #d94f30);
  }

  .search-tag.active {
    background: var(--color-primary, #d94f30);
    color: white;
    border-color: var(--color-primary, #d94f30);
  }
`

export default SearchBar
