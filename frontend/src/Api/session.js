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

// A session without its signed token (from an older version, or edited by hand) is not valid
export function getSession() {
  const session = read(SESSION_KEY)
  return typeof session?.token === 'string' && typeof session.role === 'string' ? session : null
}
export const saveSession = (user) => write(SESSION_KEY, user)
export const clearSession = () => remove(SESSION_KEY)

// client.js fires this event when the backend rejects the token; SessionProvider signs out
export const SESSION_EXPIRED_EVENT = 'cafecito:session-expired'
export const notifySessionExpired = () => window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))

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
