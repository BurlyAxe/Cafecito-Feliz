import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import Alert from '../../Components/Alert/Alert.jsx'
import Button from '../../Components/Button/Button.jsx'
import Icon from '../../Components/Icons/Icon.jsx'
import Input from '../../Components/Input/Input.jsx'
import useSession from '../../Components/SessionProvider/useSession.js'
import { login } from '../../Api/authApi.js'
import '../../Styles/pages/login-page.css'

function LoginPage() {
  const { user, sessionExpired, signIn } = useSession()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/clientes" replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!username.trim()) nextErrors.username = 'Escribe tu usuario'
    if (!password) nextErrors.password = 'Escribe tu contraseña'
    setErrors(nextErrors)
    setApiError(null)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    try {
      const { data } = await login({ username, password })
      signIn(data)
      navigate('/clientes', { replace: true })
    } catch (error) {
      setApiError(error)
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-card__header">
          <span className="login-card__logo">
            <Icon name="cup" size={32} />
          </span>
          <h1 className="login-card__title">Cafecito feliz</h1>
          <p className="login-card__subtitle">Inicia sesión para abrir la caja.</p>
        </div>

        <form className="login-card__form" onSubmit={handleSubmit} noValidate>
          {sessionExpired && !apiError && (
            <Alert tone="info">Tu sesión expiró. Vuelve a iniciar sesión.</Alert>
          )}
          {apiError && (
            <Alert tone="error" messages={apiError.details ?? []}>
              {apiError.message}
            </Alert>
          )}
          <Input
            label="Usuario"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            error={errors.username}
            onChange={(event) => {
              setUsername(event.target.value)
              setErrors((current) => ({ ...current, username: undefined }))
            }}
          />
          <Input
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            error={errors.password}
            onChange={(event) => {
              setPassword(event.target.value)
              setErrors((current) => ({ ...current, password: undefined }))
            }}
          />
          <Button type="submit" fullWidth loading={loading}>
            Entrar
          </Button>
        </form>

        <p className="login-card__hint">
          Vendedor: vendedor / cafecito123 · Administrador: admin / admin123
        </p>
      </section>
    </main>
  )
}

export default LoginPage
