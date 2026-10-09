import { useState } from 'react'
import { useNavigate } from 'react-router'
import Alert from '../../Components/Alert/Alert.jsx'
import AppHeader from '../../Components/AppHeader/AppHeader.jsx'
import Button from '../../Components/Button/Button.jsx'
import Input from '../../Components/Input/Input.jsx'
import useSession from '../../Components/SessionProvider/useSession.js'
import { searchCustomers } from '../../Api/customersApi.js'
import { formatPhone } from '../../Api/format.js'
import { isPhoneTerm, normalizeSearchTerm } from '../../Api/normalizeSearchTerm.js'
import CustomerResultCard from './CustomerResultCard.jsx'
import NewCustomerForm from './NewCustomerForm.jsx'
import '../../Styles/pages/customer-lookup-page.css'

function CustomerLookupPage() {
  const { customer: sessionCustomer, selectCustomer } = useSession()
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [term, setTerm] = useState('')
  const [results, setResults] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [registered, setRegistered] = useState(false)

  const reset = () => {
    setApiError(null)
    setResults(null)
    setSelected(null)
    setShowForm(false)
    setRegistered(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const normalized = normalizeSearchTerm(input)
    reset()
    if (!normalized) {
      setFieldError('Escribe un teléfono o un correo')
      return
    }
    if (isPhoneTerm(normalized) && normalized.length < 10) {
      setFieldError('El teléfono debe tener 10 dígitos')
      return
    }
    setFieldError('')
    setLoading(true)
    try {
      const { data } = await searchCustomers({ search: normalized, limit: 5 })
      setTerm(normalized)
      setResults(data)
      if (data.length === 1) setSelected(data[0])
      if (data.length === 0) setShowForm(true)
    } catch (error) {
      setApiError(error)
    } finally {
      setLoading(false)
    }
  }

  const startSale = (customer) => {
    selectCustomer(customer)
    navigate('/venta')
  }

  const handleCreated = (customer) => {
    setShowForm(false)
    setRegistered(true)
    setSelected(customer)
  }

  const initialValues = {
    name: !term.includes('@') && !isPhoneTerm(term) ? term : '',
    phone: isPhoneTerm(term) ? term : '',
    email: term.includes('@') ? term : '',
  }

  return (
    <>
      <AppHeader />
      <main className="lookup">
        {sessionCustomer && (
          <div className="lookup__ongoing">
            <span>Venta en curso con {sessionCustomer.name}</span>
            <Button size="sm" onClick={() => navigate('/venta')}>
              Continuar venta
            </Button>
          </div>
        )}

        <h1 className="lookup__title">¿Quién nos visita hoy?</h1>
        <p className="lookup__subtitle">
          Busca al cliente por su número de teléfono o su correo antes de iniciar la venta.
        </p>

        <section className="lookup__card">
          <form className="lookup__form" onSubmit={handleSubmit} noValidate>
            <Input
              className="lookup__input"
              label="Teléfono o correo del cliente"
              name="search"
              placeholder="449 123 4567 o nombre@correo.com"
              autoFocus
              value={input}
              error={fieldError}
              onChange={(event) => {
                setInput(event.target.value)
                setFieldError('')
              }}
            />
            <Button type="submit" icon="search" loading={loading}>
              Buscar
            </Button>
          </form>
          <p className="lookup__hint">
            Prueba con 4491234567, carlos.ruiz@correo.com o 4495550199.
          </p>
        </section>

        {apiError && (
          <Alert tone="error" messages={apiError.details ?? []}>
            {apiError.message}
          </Alert>
        )}

        {results && results.length > 1 && !selected && (
          <section className="lookup__list" data-testid="customer-list">
            <h2 className="lookup__list-title">Encontramos {results.length} clientes</h2>
            {results.map((item) => (
              <button
                key={item._id}
                type="button"
                className="lookup__row"
                onClick={() => setSelected(item)}
              >
                <span className="lookup__row-name">{item.name}</span>
                <span>{formatPhone(item.phone)}</span>
                <span>{item.email}</span>
              </button>
            ))}
          </section>
        )}

        {results && results.length === 0 && (
          <Alert tone="info">No encontramos a ningún cliente con «{term}».</Alert>
        )}

        {showForm && (
          <NewCustomerForm
            key={term}
            initialValues={initialValues}
            onCreated={handleCreated}
            onCancel={() => setShowForm(false)}
          />
        )}

        {registered && <Alert tone="success">Cliente registrado</Alert>}

        {selected && (
          <CustomerResultCard key={selected._id} customer={selected} onStartSale={startSale} />
        )}
      </main>
    </>
  )
}

export default CustomerLookupPage
