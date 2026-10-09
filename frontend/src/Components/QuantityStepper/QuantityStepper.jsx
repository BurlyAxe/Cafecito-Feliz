import Icon from '../Icons/Icon.jsx'
import '../../Styles/components/quantity-stepper.css'

function QuantityStepper({ value, min = 1, onIncrement, onDecrement, disabled = false }) {
  return (
    <div className="quantity-stepper">
      <button
        type="button"
        className="quantity-stepper__button"
        aria-label="Quitar uno"
        disabled={disabled || value <= min}
        onClick={onDecrement}
      >
        <Icon name="minus" size={14} />
      </button>
      <span className="quantity-stepper__value" data-testid="quantity-value">
        {value}
      </span>
      <button
        type="button"
        className="quantity-stepper__button"
        aria-label="Agregar uno"
        disabled={disabled}
        onClick={onIncrement}
      >
        <Icon name="plus" size={14} />
      </button>
    </div>
  )
}

export default QuantityStepper
