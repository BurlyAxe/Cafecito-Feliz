import { useCallback, useEffect, useState } from 'react'
import { quoteCart } from '../../Api/salesApi.js'

const QUOTE_DELAY_MS = 250
const IDLE = { quote: null, quoting: false, error: null }

// Asks the backend for the cart totals every time the cart or the customer changes.
// Requests are debounced and the previous one is aborted, so only the latest cart wins.
// While a new quote is in flight the last good quote stays available.
function useCartQuote(customerId, cart) {
  const itemsKey = JSON.stringify(
    cart.map(({ productId, quantity }) => ({ productId, quantity })),
  )
  const isEmpty = cart.length === 0
  const [version, setVersion] = useState(0)
  const requestKey = isEmpty ? '' : `${customerId}|${itemsKey}|${version}`

  const [state, setState] = useState(() => ({ ...IDLE, quoting: !isEmpty }))
  const [trackedKey, setTrackedKey] = useState(requestKey)

  // Adjust the state during render when the request changes (no extra effect pass)
  if (trackedKey !== requestKey) {
    setTrackedKey(requestKey)
    setState(requestKey ? (current) => ({ ...current, quoting: true }) : IDLE)
  }

  useEffect(() => {
    if (!requestKey) return undefined
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const { data } = await quoteCart(
          { customerId, items: JSON.parse(itemsKey) },
          { signal: controller.signal },
        )
        setState({ quote: data, quoting: false, error: null })
      } catch (error) {
        if (error?.name === 'AbortError') return
        setState((current) => ({ ...current, quoting: false, error }))
      }
    }, QUOTE_DELAY_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [requestKey, customerId, itemsKey])

  const refresh = useCallback(() => setVersion((current) => current + 1), [])

  return { ...state, refresh }
}

export default useCartQuote
