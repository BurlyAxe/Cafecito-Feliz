// Cypress hardcodes these keys in cypress/support/commands.js
const SESSION_KEY = 'cafecito.session'
const CUSTOMER_KEY = 'cafecito.customer'
const CART_KEY = 'cafecito.cart'

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

// The cart lives in sessionStorage so it survives going to /clientes and back
function isCartItem(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    typeof item.productId === 'string' &&
    typeof item.name === 'string' &&
    Number.isFinite(item.price) &&
    Number.isSafeInteger(item.quantity) &&
    item.quantity > 0
  )
}

export function getCart() {
  const cart = read(CART_KEY)
  return Array.isArray(cart) ? cart.filter(isCartItem) : []
}

export const saveCart = (cart) => write(CART_KEY, cart)
export const clearCart = () => remove(CART_KEY)
