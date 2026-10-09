import { useCallback, useEffect, useState } from 'react'
import { fetchProducts } from '../../Api/productsApi.js'

// Loads the catalog. The backend sorts newest first, so the list is reversed
// to show the products in the order they were created
function useCatalog({ includeOutOfStock = false } = {}) {
  const [state, setState] = useState({ products: [], loading: true, error: null })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchProducts({ includeOutOfStock })
      .then(({ data }) => {
        if (!cancelled) setState({ products: [...data].reverse(), loading: false, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState((current) => ({ ...current, loading: false, error }))
      })
    return () => {
      cancelled = true
    }
  }, [includeOutOfStock, version])

  // Keeps the current products on screen while the new list loads
  const reload = useCallback(() => {
    setState((current) => ({ ...current, loading: current.products.length === 0, error: null }))
    setVersion((current) => current + 1)
  }, [])

  return { ...state, reload }
}

export default useCatalog
