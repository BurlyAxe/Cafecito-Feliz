import Alert from '../Alert/Alert.jsx'
import Button from '../Button/Button.jsx'
import Icon from '../Icons/Icon.jsx'
import QuantityStepper from '../QuantityStepper/QuantityStepper.jsx'
import { formatCurrency } from '../../Api/format.js'
import '../../Styles/components/cart-panel.css'

const MINUS_SIGN = '−'

function countLabel(count) {
  return count === 1 ? '1 artículo' : `${count} artículos`
}

// Line totals come from the backend quote; before the first quote arrives
// the line shows the catalog price times the quantity as a placeholder
function getLineTotal(item, quoteLine) {
  if (quoteLine && quoteLine.quantity === item.quantity) return quoteLine.lineTotal
  return (Math.round(item.price * 100) * item.quantity) / 100
}

function CartLine({ item, quoteLine, onIncrement, onDecrement, onRemove }) {
  const unitPrice = quoteLine?.unitPrice ?? item.price
  const showShortage =
    quoteLine && quoteLine.quantity === item.quantity && !quoteLine.hasEnoughStock

  return (
    <li className="cart-line" data-testid="cart-line">
      <div className="cart-line__top">
        <div className="cart-line__info">
          <span className="cart-line__name">{item.name}</span>
          <span className="cart-line__unit">{formatCurrency(unitPrice)}</span>
        </div>
        <button
          type="button"
          className="cart-line__remove"
          aria-label={`Quitar ${item.name}`}
          onClick={() => onRemove(item.productId)}
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
      <div className="cart-line__bottom">
        <QuantityStepper
          value={item.quantity}
          onIncrement={() => onIncrement(item.productId)}
          onDecrement={() => onDecrement(item.productId)}
        />
        <span className="cart-line__total">{formatCurrency(getLineTotal(item, quoteLine))}</span>
      </div>
      {showShortage && (
        <p className="cart-line__warning" role="alert">
          Solo hay {quoteLine.available} disponibles
        </p>
      )}
    </li>
  )
}

function CartPanel({
  items = [],
  quote,
  quoting = false,
  error,
  onIncrement,
  onDecrement,
  onRemove,
  onCheckout,
}) {
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const isEmpty = items.length === 0
  const quoteLines = new Map((quote?.items ?? []).map((line) => [line.productId, line]))
  const discountPercent = quote?.discountPercent ?? 0
  const canCheckout = !isEmpty && !quoting && !error && Boolean(quote?.canCheckout)
  const discountLabel =
    discountPercent > 0 && !isEmpty ? `Descuento (${discountPercent}%)` : 'Descuento'

  return (
    <aside className="cart-panel" aria-label="Orden actual" data-testid="cart-panel">
      <header className="cart-panel__header">
        <h2 className="cart-panel__title">Orden actual</h2>
        <span className="cart-panel__count">{countLabel(count)}</span>
      </header>

      {isEmpty ? (
        <p className="cart-panel__empty">Toca un producto para agregarlo.</p>
      ) : (
        <ul className="cart-panel__lines">
          {items.map((item) => (
            <CartLine
              key={item.productId}
              item={item}
              quoteLine={quoteLines.get(item.productId)}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}

      {error && !isEmpty && (
        <Alert tone="error" messages={error.details ?? []}>
          {error.message}
        </Alert>
      )}

      <dl className="cart-panel__totals">
        <div className="cart-panel__row">
          <dt>Subtotal</dt>
          <dd>{formatCurrency(isEmpty ? 0 : quote?.subtotal)}</dd>
        </div>
        <div className="cart-panel__row">
          <dt>{discountLabel}</dt>
          <dd>
            {MINUS_SIGN}
            {formatCurrency(isEmpty ? 0 : quote?.discountAmount)}
          </dd>
        </div>
        <div className="cart-panel__row cart-panel__row--total">
          <dt>Total</dt>
          <dd data-testid="cart-total">{formatCurrency(isEmpty ? 0 : quote?.total)}</dd>
        </div>
      </dl>

      <p className="cart-panel__status" aria-live="polite">
        {quoting && !isEmpty ? 'Actualizando…' : ''}
      </p>

      <Button fullWidth disabled={!canCheckout} onClick={onCheckout}>
        {quote && !isEmpty ? `Cobrar ${formatCurrency(quote.total)}` : 'Cobrar'}
      </Button>

      {discountPercent > 0 && !isEmpty && (
        <p className="cart-panel__note">Descuento de cliente frecuente aplicado</p>
      )}
    </aside>
  )
}

export default CartPanel
