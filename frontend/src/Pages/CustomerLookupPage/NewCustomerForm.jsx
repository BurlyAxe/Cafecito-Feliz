import { useState } from 'react'
import Alert from '../../Components/Alert/Alert.jsx'
import Button from '../../Components/Button/Button.jsx'
import Input from '../../Components/Input/Input.jsx'
import { createCustomer } from '../../Api/customersApi.js'

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
    const name = values.name.trim()
    const phone = values.phone.replace(/\D/g, '')
    const email = values.email.trim().toLowerCase()
    const nextErrors = {}
    if (!name) nextErrors.name = 'Escribe el nombre'
    if (phone.length !== 10) nextErrors.phone = 'El teléfono debe tener 10 dígitos'
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Escribe un correo válido'
    setErrors(nextErrors)
    setApiError(null)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    try {
      const { data } = await createCustomer({ name, phone, email })
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
