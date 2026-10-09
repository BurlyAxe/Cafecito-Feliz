import { useState } from 'react'
import Alert from '../../Components/Alert/Alert.jsx'
import Button from '../../Components/Button/Button.jsx'
import Input from '../../Components/Input/Input.jsx'
import { createCustomer } from '../../Api/customersApi.js'
import { validateCustomer } from '../../Api/validators.js'

function NewCustomerForm({ initialValues, onCreated, onCancel }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const { values: customer, errors: nextErrors, isValid } = validateCustomer(values)
    setErrors(nextErrors)
    setApiError(null)
    if (!isValid) return

    setLoading(true)
    try {
      const { data } = await createCustomer(customer)
      onCreated(data)
    } catch (error) {
      setApiError(error)
      setLoading(false)
    }
  }

  return (
    <form
      className="new-customer"
      onSubmit={handleSubmit}
      noValidate
      data-testid="new-customer-form"
    >
      <h2 className="new-customer__title">Registrar cliente nuevo</h2>
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
        label="Teléfono"
        name="phone"
        type="tel"
        value={values.phone}
        error={errors.phone}
        onChange={handleChange('phone')}
      />
      <Input
        label="Correo"
        name="email"
        value={values.email}
        error={errors.email}
        onChange={handleChange('email')}
      />
      <div className="new-customer__actions">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Registrar cliente
        </Button>
      </div>
    </form>
  )
}

export default NewCustomerForm
