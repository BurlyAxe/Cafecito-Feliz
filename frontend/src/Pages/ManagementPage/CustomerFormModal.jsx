import { useId, useState } from 'react'
import Alert from '../../Components/Alert/Alert.jsx'
import Button from '../../Components/Button/Button.jsx'
import Input from '../../Components/Input/Input.jsx'
import Modal from '../../Components/Modal/Modal.jsx'
import { updateCustomer } from '../../Api/customersApi.js'
import { formatPhone } from '../../Api/format.js'
import { validateCustomer } from '../../Api/validators.js'

function CustomerFormModal({ customer, onClose, onSaved }) {
  const formId = useId()
  const [values, setValues] = useState({
    name: customer.name,
    phone: formatPhone(customer.phone),
    email: customer.email,
  })
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
    const { values: changes, errors: nextErrors, isValid } = validateCustomer(values)
    setErrors(nextErrors)
    setApiError(null)
    if (!isValid) return

    setSaving(true)
    try {
      const { data } = await updateCustomer(customer._id, changes)
      onSaved(data)
    } catch (error) {
      setApiError(error)
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      title="Editar cliente"
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            Guardar cambios
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
          type="email"
          value={values.email}
          error={errors.email}
          onChange={handleChange('email')}
        />
      </form>
    </Modal>
  )
}

export default CustomerFormModal
