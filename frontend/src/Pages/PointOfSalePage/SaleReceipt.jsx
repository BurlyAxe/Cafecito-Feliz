import {
  formatCurrency,
  formatDateTime,
  formatDiscount,
  formatSaleNumber,
  formatPaymentMethod,
} from '../../Api/format.js'

function SaleReceipt({ sale, customerName }) {
  const saleNumber = formatSaleNumber(sale._id)

  return (
    <div className="sale-receipt" data-testid="sale-receipt">
      <div className="sale-receipt__header" role="status">
        <p className="sale-receipt__number">Folio {saleNumber}</p>
        <p className="sale-receipt__meta">{customerName}</p>
        <p className="sale-receipt__meta">{formatDateTime(sale.createdAt)}</p>
      </div>

      <ul className="sale-receipt__lines">
        {sale.items.map((item) => (
          <li key={item._id ?? item.productId} className="sale-receipt__line">
            <span>
              {item.productNameSnapshot} × {item.quantity}
            </span>
            <span>{formatCurrency(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="sale-receipt__totals">
        <div className="sale-receipt__row">
          <dt>Subtotal</dt>
          <dd>{formatCurrency(sale.subtotal)}</dd>
        </div>
        <div className="sale-receipt__row">
          <dt>{sale.discountPercent > 0 ? `Descuento (${sale.discountPercent}%)` : 'Descuento'}</dt>
          <dd>
            {formatDiscount(sale.discountAmount)}
          </dd>
        </div>
        <div className="sale-receipt__row sale-receipt__row--total">
          <dt>Total</dt>
          <dd data-testid="receipt-total">{formatCurrency(sale.total)}</dd>
        </div>
        <div className="sale-receipt__row">
          <dt>Método de pago</dt>
          <dd data-testid="receipt-payment">{formatPaymentMethod(sale.paymentMethod)}</dd>
        </div>
      </dl>
    </div>
  )
}

export default SaleReceipt
