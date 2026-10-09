import { useState } from 'react'
import Alert from '../../Components/Alert/Alert.jsx'
import Button from '../../Components/Button/Button.jsx'
import Modal from '../../Components/Modal/Modal.jsx'
import { PAYMENT_METHODS } from '../../Api/constants.js'
import { formatCurrency } from '../../Api/format.js'
import { createSale } from '../../Api/salesApi.js'
import SaleReceipt from './SaleReceipt.jsx'

// Two steps in one modal: choose the payment method, then show the receipt
function CheckoutModal({
  customer,
  items,
  total,
  onClose,
  onSold,
  onFailed,
  onNextCustomer,
}) {
  const [paymentMethod, setPaymentMethod] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState(null)
  const [sale, setSale] = useState(null)

  const handleConfirm = async () => {
    if (!paymentMethod || posting) return
    setPosting(true)
    setError(null)
    try {
      const { data } = await createSale({
        customerId: customer._id,
        paymentMethod,
        items: items.map(({ productId, quantity }) => ({ productId, quantity })),
      })
      setSale(data)
      onSold(data)
    } catch (requestError) {
      setError(requestError)
      onFailed(requestError)
    } finally {
      setPosting(false)
    }
  }

  if (sale) {
    return (
      <Modal
        open
        title="Venta registrada"
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={onNextCustomer}>
              Atender a otro cliente
            </Button>
            <Button onClick={onClose}>Nueva venta (mismo cliente)</Button>
          </>
        }
      >
        <SaleReceipt sale={sale} customerName={customer.name} />
      </Modal>
    )
  }

  return (
    <Modal
      open
      title="Cobrar orden"
      onClose={posting ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={posting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!paymentMethod} loading={posting}>
            Confirmar cobro
          </Button>
        </>
      }
    >
      <div className="checkout">
        <div className="checkout__total">
          <span>Total a cobrar</span>
          <strong data-testid="checkout-total">{formatCurrency(total)}</strong>
        </div>

        {error && (
          <Alert tone="error" messages={error.details ?? []}>
            {error.message}
          </Alert>
        )}

        <fieldset className="checkout__methods" disabled={posting}>
          <legend className="checkout__legend">Método de pago</legend>
          <div className="checkout__options" role="radiogroup" aria-label="Método de pago">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.value}
                className={`checkout__option ${
                  paymentMethod === method.value ? 'checkout__option--selected' : ''
                }`.trim()}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  className="visually-hidden"
                  checked={paymentMethod === method.value}
                  onChange={() => setPaymentMethod(method.value)}
                />
                {method.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </Modal>
  )
}

export default CheckoutModal
