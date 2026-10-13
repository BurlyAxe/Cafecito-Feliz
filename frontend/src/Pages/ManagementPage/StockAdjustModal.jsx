import { useId, useState } from 'react'
import Alert from '../../Components/Alert/Alert.jsx'
import Button from '../../Components/Button/Button.jsx'
import Input from '../../Components/Input/Input.jsx'
import Modal from '../../Components/Modal/Modal.jsx'
import { adjustStock } from '../../Api/productsApi.js'

const MODES = [
  { value: 'add', label: 'Agregar' },
  { value: 'remove', label: 'Quitar' },
]

function parseQuantity(value) {
  const trimmed = value.trim()
  return /^\d+$/.test(trimmed) && Number(trimmed) > 0 ? Number(trimmed) : null
}

// Adds or removes units. The backend checks the stock again, because another
// register may have sold units since this list was loaded
function StockAdjustModal({ product, onClose, onAdjusted }) {
  const formId = useId()
  const [mode, setMode] = useState('add')
  const [quantity, setQuantity] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [apiError, setApiError] = useState(null)
  const [saving, setSaving] = useState(false)

  const amount = parseQuantity(quantity)
  const delta = amount === null ? null : mode === 'add' ? amount : -amount
  const nextStock = delta === null ? null : product.stock + delta

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setApiError(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    setApiError(null)
    if (delta === null) {
      setFieldError('Escribe una cantidad entera mayor a cero')
      return
    }

    setSaving(true)
    try {
      const { data } = await adjustStock(product._id, delta)
      onAdjusted(data)
    } catch (error) {
      setApiError(error)
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      title={`Ajustar stock de ${product.name}`}
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            Aplicar ajuste
          </Button>
        </>
      }
    >
      <form id={formId} className="management-form" onSubmit={handleSubmit} noValidate>
        <p>
          Stock actual: <strong data-testid="current-stock">{product.stock}</strong>
        </p>

        <fieldset className="stock-adjust__modes" disabled={saving}>
          <legend className="stock-adjust__legend">Movimiento</legend>
          <div className="stock-adjust__options" role="radiogroup" aria-label="Movimiento">
            {MODES.map((option) => (
              <label
                key={option.value}
                className={`stock-adjust__option ${
                  mode === option.value ? 'stock-adjust__option--selected' : ''
                }`.trim()}
              >
                <input
                  type="radio"
                  name="mode"
                  value={option.value}
                  className="visually-hidden"
                  checked={mode === option.value}
                  onChange={() => handleModeChange(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <Input
          label="Cantidad"
          name="quantity"
          type="number"
          inputMode="numeric"
          step="1"
          min="1"
          value={quantity}
          error={fieldError}
          onChange={(event) => {
            setQuantity(event.target.value)
            setFieldError('')
            setApiError(null)
          }}
        />

        <p className="stock-adjust__preview" aria-live="polite" data-testid="stock-preview">
          {nextStock !== null && nextStock >= 0 ? `Nuevo stock: ${nextStock}` : ''}
        </p>

        {apiError && (
          <Alert tone="error" messages={apiError.details ?? []}>
            {apiError.message}
          </Alert>
        )}
      </form>
    </Modal>
  )
}

export default StockAdjustModal
