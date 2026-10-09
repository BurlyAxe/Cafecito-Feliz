export const CART_ACTIONS = {
  ADD: 'add',
  INCREMENT: 'increment',
  DECREMENT: 'decrement',
  REMOVE: 'remove',
  CLEAR: 'clear',
}

function changeQuantity(cart, productId, delta) {
  return cart.map((item) =>
    item.productId === productId
      ? { ...item, quantity: Math.max(1, item.quantity + delta) }
      : item,
  )
}

// Cart item shape: { productId, name, price, quantity }
export function cartReducer(cart, action) {
  switch (action.type) {
    case CART_ACTIONS.ADD: {
      const { product } = action
      if (cart.some((item) => item.productId === product._id)) {
        return changeQuantity(cart, product._id, 1)
      }
      return [
        ...cart,
        { productId: product._id, name: product.name, price: product.price, quantity: 1 },
      ]
    }
    case CART_ACTIONS.INCREMENT:
      return changeQuantity(cart, action.productId, 1)
    case CART_ACTIONS.DECREMENT:
      return changeQuantity(cart, action.productId, -1)
    case CART_ACTIONS.REMOVE:
      return cart.filter((item) => item.productId !== action.productId)
    case CART_ACTIONS.CLEAR:
      return []
    default:
      return cart
  }
}
