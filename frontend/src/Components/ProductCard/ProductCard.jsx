import Badge from '../Badge/Badge.jsx'
import Icon from '../Icons/Icon.jsx'
import { LOW_STOCK_THRESHOLD } from '../../Api/constants.js'
import { formatCurrency } from '../../Api/format.js'
import '../../Styles/components/product-card.css'

function StockBadge({ stock }) {
  if (stock <= 0) return <Badge tone="muted">Agotado</Badge>
  if (stock <= LOW_STOCK_THRESHOLD) return <Badge tone="warning">Quedan {stock}</Badge>
  return <Badge tone="success">{stock} en stock</Badge>
}

function ProductCard({ product, showStock = false, disabled = false, onAdd }) {
  const handleAdd = () => {
    if (!disabled) onAdd?.(product)
  }

  return (
    <article
      className={`product-card ${disabled ? 'product-card--disabled' : ''}`.trim()}
      data-testid="product-card"
      aria-disabled={disabled || undefined}
      onClick={handleAdd}
    >
      <div className="product-card__info">
        <h3 className="product-card__name">{product.name}</h3>
        {product.description && <p className="product-card__description">{product.description}</p>}
        {showStock && (
          <div className="product-card__stock">
            <StockBadge stock={product.stock} />
          </div>
        )}
      </div>
      <div className="product-card__footer">
        <span className="product-card__price">{formatCurrency(product.price)}</span>
        <button
          type="button"
          className="product-card__add"
          aria-label={`Agregar ${product.name}`}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation()
            handleAdd()
          }}
        >
          <Icon name="plus" size={18} />
        </button>
      </div>
    </article>
  )
}

export default ProductCard
