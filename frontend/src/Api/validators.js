const PHONE_LENGTH = 10
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

// Cleans the customer form values the way the backend stores them
// (digits-only phone, lowercase email) and returns the field errors
export function validateCustomer({ name = '', phone = '', email = '' }) {
  const values = {
    name: name.trim(),
    phone: phone.replace(/\D/g, ''),
    email: email.trim().toLowerCase(),
  }
  const errors = {}
  if (!values.name) errors.name = 'Escribe el nombre'
  if (values.phone.length !== PHONE_LENGTH) errors.phone = 'El teléfono debe tener 10 dígitos'
  if (!EMAIL_PATTERN.test(values.email)) errors.email = 'Escribe un correo válido'
  return { values, errors, isValid: Object.keys(errors).length === 0 }
}
