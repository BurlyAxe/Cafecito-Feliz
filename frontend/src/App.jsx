import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import SessionProvider from './Components/SessionProvider/SessionProvider.jsx'
import useSession from './Components/SessionProvider/useSession.js'
import ProtectedRoute from './Components/ProtectedRoute/ProtectedRoute.jsx'
import { ROLES } from './Api/constants.js'
import LoginPage from './Pages/LoginPage/LoginPage.jsx'
import CustomerLookupPage from './Pages/CustomerLookupPage/CustomerLookupPage.jsx'
import PointOfSalePage from './Pages/PointOfSalePage/PointOfSalePage.jsx'
import ManagementPage from './Pages/ManagementPage/ManagementPage.jsx'
import NotFoundPage from './Pages/NotFoundPage/NotFoundPage.jsx'

function HomeRedirect() {
  const { user } = useSession()
  return <Navigate to={user ? '/clientes' : '/login'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/clientes" element={<CustomerLookupPage />} />
          </Route>
          <Route element={<ProtectedRoute requireCustomer />}>
            <Route path="/venta" element={<PointOfSalePage />} />
          </Route>
          <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
            <Route path="/gestion" element={<ManagementPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  )
}

export default App
