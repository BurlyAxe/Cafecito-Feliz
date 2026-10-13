import '../../Styles/components/category-tabs.css'

function CategoryTabs({ options = [], value, onChange, label = 'Categorías' }) {
  return (
    <div className="category-tabs" role="tablist" aria-label={label}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`category-tabs__tab ${selected ? 'category-tabs__tab--active' : ''}`.trim()}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default CategoryTabs
