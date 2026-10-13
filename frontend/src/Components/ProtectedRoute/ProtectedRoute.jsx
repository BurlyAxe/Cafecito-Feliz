import { Navigate, Outlet } from 'react-router'
import useSession from '../SessionProvider/useSession.js'

function ProtectedRoute({ roles, requireCustomer = false }) {
  const { user, customer } = useSession()

  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/venta" replace />
  if (requireCustomer && !customer) return <Navigate to="/clientes" replace />

  return <Outlet />
}

export default ProtectedRoute
