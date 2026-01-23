function CategoryTabs({ activeTab, onTabChange }) {
  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'tecnología', label: 'Tecnología' },
    { id: 'arte', label: 'Arte' },
    { id: 'ambiente', label: 'Ambiente' },
    { id: 'educación', label: 'Educación' },
    { id: 'social', label: 'Social' }
  ]

  return (
    <div className="category-tabs">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onTabChange(category.id)}
          className={`category-tab ${activeTab === category.id ? 'active' : ''}`}
        >
          {category.label}
        </button>
      ))}

      <style>{`
        .category-tabs {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          flex-wrap: wrap;
          padding: 1rem 0;
        }

        .category-tab {
          padding: 0.5rem 1.25rem;
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: 9999px;
          background: white;
          color: var(--color-foreground, #374151);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .category-tab:hover {
          background: var(--color-muted, #f9fafb);
          border-color: var(--color-primary, #d94f30);
        }

        .category-tab.active {
          background: var(--color-primary, #d94f30);
          color: white;
          border-color: var(--color-primary, #d94f30);
        }

        @media (max-width: 640px) {
          .category-tabs {
            overflow-x: auto;
            justify-content: flex-start;
            flex-wrap: nowrap;
            padding: 1rem;
            margin: 0 -1rem;
          }
        }
      `}</style>
    </div>
  )
}

export default CategoryTabs