import { Link, useNavigate } from 'react-router'
import Icon from '../Icons/Icon.jsx'
import Button from '../Button/Button.jsx'
import useSession from '../SessionProvider/useSession.js'
import { ROLE_LABELS } from '../../Api/constants.js'
import { formatPhone, getInitials } from '../../Api/format.js'
import '../../Styles/components/app-header.css'

function getSubtitle(isAdmin) {
  if (isAdmin) return 'Caja 1 · Sesión de administrador'
  return new Date().getHours() < 14 ? 'Caja 1 · Turno matutino' : 'Caja 1 · Turno vespertino'
}

function AppHeader({ showCustomer = false }) {
  const { user, customer, isAdmin, signOut } = useSession()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo">
          <Icon name="cup" size={22} />
        </span>
        <div>
          <p className="app-header__title">Cafecito feliz</p>
          <p className="app-header__subtitle">{getSubtitle(isAdmin)}</p>
        </div>
      </div>

      <div className="app-header__actions">
        {showCustomer && customer && (
          <div className="customer-chip" data-testid="customer-chip">
            <span className="customer-chip__avatar">{getInitials(customer.name)}</span>
            <div className="customer-chip__info">
              <span className="customer-chip__name">{customer.name}</span>
              <span className="customer-chip__phone">{formatPhone(customer.phone)}</span>
            </div>
            <Link className="customer-chip__change" to="/clientes">
              Cambiar
            </Link>
          </div>
        )}
        {isAdmin && (
          <Link className="app-header__link" to="/gestion">
            <Icon name="sliders" size={18} />
            Gestión
          </Link>
        )}
        {user && (
          <span className="app-header__role" data-testid="role-badge">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        )}
        <Button variant="ghost" size="sm" icon="logout" onClick={handleSignOut}>
          Salir
        </Button>
      </div>
    </header>
  )
}

export default AppHeader
