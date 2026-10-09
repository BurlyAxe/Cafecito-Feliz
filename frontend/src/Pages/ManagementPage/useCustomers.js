import { useCallback, useEffect, useState } from 'react'
import { searchCustomers } from '../../Api/customersApi.js'

const EMPTY_META = { total: 0, page: 1, limit: 10, totalPages: 0 }

// Loads one page of customers from the backend search.
// The previous rows stay on screen while a new page or search loads
function useCustomers({ search, page, limit }) {
  const [state, setState] = useState({
    customers: [],
    meta: EMPTY_META,
    loading: true,
    error: null,
  })
  const [version, setVersion] = useState(0)
  const requestKey = `${search}|${page}|${limit}|${version}`
  const [trackedKey, setTrackedKey] = useState(requestKey)

  // Adjust the state during render when the request changes (no extra effect pass)
  if (trackedKey !== requestKey) {
    setTrackedKey(requestKey)
    setState((current) => ({ ...current, loading: true, error: null }))
  }

  useEffect(() => {
    let cancelled = false
    searchCustomers({ search, page, limit })
      .then(({ data, meta }) => {
        if (!cancelled) setState({ customers: data, meta, loading: false, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState((current) => ({ ...current, loading: false, error }))
      })
    return () => {
      cancelled = true
    }
  }, [search, page, limit, version])

  const reload = useCallback(() => setVersion((current) => current + 1), [])

  return { ...state, reload }
}

export default useCustomers
