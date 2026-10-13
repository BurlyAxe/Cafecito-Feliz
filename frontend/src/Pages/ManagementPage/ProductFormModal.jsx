import { useId, useState } from 'react'
import Alert from '../../Components/Alert/Alert.jsx'
import Button from '../../Components/Button/Button.jsx'
import Input from '../../Components/Input/Input.jsx'
import Modal from '../../Components/Modal/Modal.jsx'
import Select from '../../Components/Select/Select.jsx'
import { CATEGORIES } from '../../Api/constants.js'
import { createProduct, updateProduct } from '../../Api/productsApi.js'

function getInitialValues(product) {
  return {
    name: product?.name ?? '',
    description: product?.description ?? '',
    category: product?.category ?? '',
    price: product ? String(product.price) : '',
    stock: '0',
  }
}

// Returns the payload with numbers as numbers, plus the field errors
function validateProduct(values, isNew) {
  const price = values.price.trim() === '' ? Number.NaN : Number(values.price)
  const stock = values.stock.trim()
  const product = {
    name: values.name.trim(),
    description: values.description.trim(),
    category: values.category,
    price,
  }
  const errors = {}
  if (!product.name) errors.name = 'Escribe el nombre del producto'
  if (!product.category) errors.category = 'Elige una categoría'
  if (!Number.isFinite(price) || price < 0) errors.price = 'Escribe un precio válido'
  if (isNew) {
    if (/^\d+$/.test(stock)) product.stock = Number(stock)
    else errors.stock = 'El stock debe ser un número entero'
  }
  return { product, errors, isValid: Object.keys(errors).length === 0 }
}

// Creates a product (`product` is null) or edits one. The stock is only set
// when creating; afterwards it changes through the stock adjustment
function ProductFormModal({ product, onClose, onSaved }) {
  const isNew = !product
  const formId = useId()
  const [values, setValues] = useState(() => getInitialValues(product))
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    const { product: payload, errors: nextErrors, isValid } = validateProduct(values, isNew)
    setErrors(nextErrors)
    setApiError(null)
    if (!isValid) return

    setSaving(true)
    try {
      const { data } = isNew
        ? await createProduct(payload)
        : await updateProduct(product._id, payload)
      onSaved(data)
    } catch (error) {
      setApiError(error)
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      title={isNew ? 'Nuevo producto' : 'Editar producto'}
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {isNew ? 'Crear producto' : 'Guardar cambios'}
          </Button>
        </>
      }
    >
      <form id={formId} className="management-form" onSubmit={handleSubmit} noValidate>
        {apiError && (
          <Alert tone="error" messages={apiError.details ?? []}>
            {apiError.message}
          </Alert>
        )}
        <Input
          label="Nombre"
          name="name"
          value={values.name}
          error={errors.name}
          onChange={handleChange('name')}
        />
        <Input
          label="Descripción (opcional)"
          name="description"
          value={values.description}
          onChange={handleChange('description')}
        />
        <Select
          label="Categoría"
          name="category"
          placeholder="Elige una categoría"
          options={CATEGORIES}
          value={values.category}
          error={errors.category}
          onChange={handleChange('category')}
        />
        <div className="management-form__row">
          <Input
            label="Precio"
            name="price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={values.price}
            error={errors.price}
            onChange={handleChange('price')}
          />
          {isNew && (
            <Input
              label="Stock inicial"
              name="stock"
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              value={values.stock}
              error={errors.stock}
              onChange={handleChange('stock')}
            />
          )}
        </div>
      </form>
    </Modal>
  )
}

export default ProductFormModal
