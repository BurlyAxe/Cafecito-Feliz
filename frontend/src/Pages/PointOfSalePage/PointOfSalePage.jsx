import { useEffect, useReducer, useState } from 'react'
import { useNavigate } from 'react-router'
import Alert from '../../Components/Alert/Alert.jsx'
import AppHeader from '../../Components/AppHeader/AppHeader.jsx'
import Badge from '../../Components/Badge/Badge.jsx'
import Button from '../../Components/Button/Button.jsx'
import CartPanel from '../../Components/CartPanel/CartPanel.jsx'
import CategoryTabs from '../../Components/CategoryTabs/CategoryTabs.jsx'
import ProductCard from '../../Components/ProductCard/ProductCard.jsx'
import useSession from '../../Components/SessionProvider/useSession.js'
import { CATEGORIES, LOW_STOCK_THRESHOLD } from '../../Api/constants.js'
import { getCart, saveCart } from '../../Api/session.js'
import { CART_ACTIONS, cartReducer } from './cartReducer.js'
import CheckoutModal from './CheckoutModal.jsx'
import useCartQuote from './useCartQuote.js'
import useCatalog from './useCatalog.js'
import '../../Styles/pages/point-of-sale-page.css'

const ALL_CATEGORIES = 'all'
const CATEGORY_OPTIONS = [{ value: ALL_CATEGORIES, label: 'Todos' }, ...CATEGORIES]

function lowStockLabel(count) {
  return count === 1 ? '1 producto con poco stock' : `${count} productos con poco stock`
}

function PointOfSalePage() {
  const { customer, isAdmin, selectCustomer, clearCustomer } = useSession()
  const navigate = useNavigate()
  const { products, loading, error: catalogError, reload } = useCatalog({
    includeOutOfStock: isAdmin,
  })
  const [cart, dispatch] = useReducer(cartReducer, undefined, getCart)
  const { quote, quoting, error: quoteError, refresh } = useCartQuote(customer?._id, cart)
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  useEffect(() => {
    saveCart(cart)
  }, [cart])

  // Only the admin sees the stock, so only the admin is stopped from adding beyond it.
  // The seller learns about missing stock from the backend quote.
  const canAddMore = (productId) => {
    if (!isAdmin) return true
    const product = products.find((item) => item._id === productId)
    const inCart = cart.find((item) => item.productId === productId)?.quantity ?? 0
    return !product || inCart < product.stock
  }

  const handleAdd = (product) => {
    if (canAddMore(product._id)) dispatch({ type: CART_ACTIONS.ADD, product })
  }

  const handleIncrement = (productId) => {
    if (canAddMore(productId)) dispatch({ type: CART_ACTIONS.INCREMENT, productId })
  }

  const handleSold = () => {
    dispatch({ type: CART_ACTIONS.CLEAR })
    reload()
    // The backend already counted this purchase; keep the session copy in sync
    selectCustomer({ ...customer, purchasesCount: (customer.purchasesCount ?? 0) + 1 })
  }

  // Stock may have changed: refresh the catalog and the cart warnings
  const handleCheckoutFailed = () => {
    reload()
    refresh()
  }

  const handleNextCustomer = () => {
    setCheckoutOpen(false)
    dispatch({ type: CART_ACTIONS.CLEAR })
    navigate('/clientes')
    clearCustomer()
  }

  const visibleProducts =
    category === ALL_CATEGORIES
      ? products
      : products.filter((product) => product.category === category)
  const lowStockCount = products.filter((product) => product.stock <= LOW_STOCK_THRESHOLD).length

  const catalogErrorAlert = catalogError && (
    <Alert tone="error" messages={catalogError.details ?? []}>
      <p>{catalogError.message}</p>
      <Button size="sm" variant="secondary" className="pos__retry" onClick={reload}>
        Reintentar
      </Button>
    </Alert>
  )

  let catalogContent
  if (loading) {
    catalogContent = <p className="pos__message">Cargando productos…</p>
  } else if (catalogError && products.length === 0) {
    catalogContent = catalogErrorAlert
  } else if (visibleProducts.length === 0) {
    catalogContent = <p className="pos__message">No hay productos en esta categoría.</p>
  } else {
    catalogContent = (
      <div className="pos__grid">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            showStock={isAdmin}
            disabled={product.stock <= 0}
            onAdd={handleAdd}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      <AppHeader showCustomer />
      <main className="pos">
        <section className="pos__catalog" aria-label="Productos">
          <div className="pos__toolbar">
            <CategoryTabs options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
            {isAdmin && lowStockCount > 0 && (
              <span className="pos__low-stock">
                <Badge tone="warning" data-testid="low-stock-pill">
                  {lowStockLabel(lowStockCount)}
                </Badge>
              </span>
            )}
          </div>
          {catalogError && products.length > 0 && catalogErrorAlert}
          {catalogContent}
        </section>

        <CartPanel
          items={cart}
          quote={quote}
          quoting={quoting}
          error={quoteError}
          onIncrement={handleIncrement}
          onDecrement={(productId) => dispatch({ type: CART_ACTIONS.DECREMENT, productId })}
          onRemove={(productId) => dispatch({ type: CART_ACTIONS.REMOVE, productId })}
          onCheckout={() => setCheckoutOpen(true)}
        />
      </main>

      {checkoutOpen && (
        <CheckoutModal
          customer={customer}
          items={cart}
          total={quote?.total}
          onClose={() => setCheckoutOpen(false)}
          onSold={handleSold}
          onFailed={handleCheckoutFailed}
          onNextCustomer={handleNextCustomer}
        />
      )}
    </>
  )
}

export default PointOfSalePage
