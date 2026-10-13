import { useCallback, useEffect, useMemo, useState } from 'react'
import SessionContext from './SessionContext.js'
import { ROLES } from '../../Api/constants.js'
import {
  SESSION_EXPIRED_EVENT,
  clearCart,
  clearSelectedCustomer,
  clearSession,
  getSelectedCustomer,
  getSession,
  saveSelectedCustomer,
  saveSession,
} from '../../Api/session.js'

function SessionProvider({ children }) {
  const [user, setUser] = useState(() => getSession())
  const [customer, setCustomer] = useState(() => getSelectedCustomer())
  const [sessionExpired, setSessionExpired] = useState(false)

  const signIn = useCallback((nextUser) => {
    saveSession(nextUser)
    setUser(nextUser)
    setSessionExpired(false)
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    clearSelectedCustomer()
    clearCart()
    setUser(null)
    setCustomer(null)
  }, [])

  // The backend rejected the token: sign out so ProtectedRoute sends the user to /login
  useEffect(() => {
    const handleExpired = () => {
      signOut()
      setSessionExpired(true)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired)
  }, [signOut])

  const selectCustomer = useCallback((nextCustomer) => {
    saveSelectedCustomer(nextCustomer)
    setCustomer(nextCustomer)
  }, [])

  const clearCustomer = useCallback(() => {
    clearSelectedCustomer()
    setCustomer(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      customer,
      isAdmin: user?.role === ROLES.ADMIN,
      sessionExpired,
      signIn,
      signOut,
      selectCustomer,
      clearCustomer,
    }),
    [user, customer, sessionExpired, signIn, signOut, selectCustomer, clearCustomer],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export default SessionProvider
