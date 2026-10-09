// Cypress hardcodes these keys in cypress/support/commands.js
export const SESSION_KEY = 'cafecito.session'
export const CUSTOMER_KEY = 'cafecito.customer'

function read(key) {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable: the session just will not persist
  }
}

function remove(key) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // Storage unavailable
  }
}

export const getSession = () => read(SESSION_KEY)
export const saveSession = (user) => write(SESSION_KEY, user)
export const clearSession = () => remove(SESSION_KEY)

export const getSelectedCustomer = () => read(CUSTOMER_KEY)
export const saveSelectedCustomer = (customer) => write(CUSTOMER_KEY, customer)
export const clearSelectedCustomer = () => remove(CUSTOMER_KEY)
