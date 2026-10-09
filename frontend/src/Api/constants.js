export const ROLES = { SELLER: 'seller', ADMIN: 'admin' }

export const ROLE_LABELS = {
  [ROLES.SELLER]: 'Vendedor',
  [ROLES.ADMIN]: 'Administrador',
}

export const CATEGORIES = [
  { value: 'coffee', label: 'Café' },
  { value: 'tea', label: 'Té' },
  { value: 'dessert', label: 'Postres' },
]

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
]

export const LOW_STOCK_THRESHOLD = 5

// Display-only: the backend is the source of truth for the discount.
// Each tier means "from minPurchases purchases, percent off".
export const DISCOUNT_TIERS = [
  { minPurchases: 20, percent: 15 },
  { minPurchases: 10, percent: 10 },
  { minPurchases: 5, percent: 5 },
]
