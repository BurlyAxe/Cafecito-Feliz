import { useEffect, useState } from 'react'
import Alert from '../../Components/Alert/Alert.jsx'
import Button from '../../Components/Button/Button.jsx'
import Modal from '../../Components/Modal/Modal.jsx'
import { fetchCustomerPurchases } from '../../Api/customersApi.js'
import {
  formatCurrency,
  formatDateTime,
  formatDiscount,
  formatSaleNumber,
  formatPaymentMethod,
} from '../../Api/format.js'

// Each line uses the name and price saved at the moment of the sale (snapshot),
// so later catalog changes do not rewrite the history
function PurchaseCard({ sale }) {
  return (
    <li className="purchase" data-testid="purchase">
      <div className="purchase__header">
        <span className="purchase__number">Folio {formatSaleNumber(sale._id)}</span>
        <span className="purchase__meta">
          {formatDateTime(sale.createdAt)} · {formatPaymentMethod(sale.paymentMethod)}
        </span>
      </div>
      <ul className="purchase__lines">
        {sale.items.map((item) => (
          <li key={item._id} className="purchase__line">
            <span>
              {item.productNameSnapshot} × {item.quantity}
              <small className="purchase__unit">
                {' '}
                ({formatCurrency(item.unitPriceSnapshot)} c/u)
              </small>
            </span>
            <span>{formatCurrency(item.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="purchase__totals">
        <div className="purchase__row">
          <dt>Subtotal</dt>
          <dd>{formatCurrency(sale.subtotal)}</dd>
        </div>
        {sale.discountPercent > 0 && (
          <div className="purchase__row">
            <dt>Descuento ({sale.discountPercent}%)</dt>
            <dd>
              {formatDiscount(sale.discountAmount)}
            </dd>
          </div>
        )}
        <div className="purchase__row purchase__row--total">
          <dt>Total</dt>
          <dd data-testid="purchase-total">{formatCurrency(sale.total)}</dd>
        </div>
      </dl>
    </li>
  )
}

function PurchaseHistoryModal({ customer, onClose }) {
  const [state, setState] = useState({ sales: [], loading: true, error: null })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchCustomerPurchases(customer._id)
      .then(({ data }) => {
        if (!cancelled) setState({ sales: data, loading: false, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState({ sales: [], loading: false, error })
      })
    return () => {
      cancelled = true
    }
  }, [customer._id, version])

  const retry = () => {
    setState({ sales: [], loading: true, error: null })
    setVersion((current) => current + 1)
  }

  let content
  if (state.loading) {
    content = <p className="management__message">Cargando compras…</p>
  } else if (state.error) {
    content = (
      <Alert tone="error" messages={state.error.details ?? []}>
        <p>{state.error.message}</p>
        <Button size="sm" variant="secondary" className="management__retry" onClick={retry}>
          Reintentar
        </Button>
      </Alert>
    )
  } else if (state.sales.length === 0) {
    content = <p className="management__message">Este cliente todavía no tiene compras.</p>
  } else {
    content = (
      <ul className="purchase-history">
        {state.sales.map((sale) => (
          <PurchaseCard key={sale._id} sale={sale} />
        ))}
      </ul>
    )
  }

  return (
    <Modal
      open
      title={`Compras de ${customer.name}`}
      onClose={onClose}
      footer={<Button onClick={onClose}>Cerrar</Button>}
    >
      {content}
    </Modal>
  )
}

export default PurchaseHistoryModal
