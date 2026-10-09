import { useCallback, useMemo, useState } from 'react'
import SessionContext from './SessionContext.js'
import { ROLES } from '../../Api/constants.js'
import {
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

  const signIn = useCallback((nextUser) => {
    saveSession(nextUser)
    setUser(nextUser)
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    clearSelectedCustomer()
    setUser(null)
    setCustomer(null)
  }, [])

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
      signIn,
      signOut,
      selectCustomer,
      clearCustomer,
    }),
    [user, customer, signIn, signOut, selectCustomer, clearCustomer],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export default SessionProvider
