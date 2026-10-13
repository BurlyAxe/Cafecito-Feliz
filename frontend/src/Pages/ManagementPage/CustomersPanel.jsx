import { useState } from 'react'
import Alert from '../../Components/Alert/Alert.jsx'
import Button from '../../Components/Button/Button.jsx'
import ConfirmDialog from '../../Components/ConfirmDialog/ConfirmDialog.jsx'
import Input from '../../Components/Input/Input.jsx'
import useSession from '../../Components/SessionProvider/useSession.js'
import { deleteCustomer } from '../../Api/customersApi.js'
import { formatPhone } from '../../Api/format.js'
import { normalizeSearchTerm } from '../../Api/normalizeSearchTerm.js'
import CustomerFormModal from './CustomerFormModal.jsx'
import IconButton from './IconButton.jsx'
import PurchaseHistoryModal from './PurchaseHistoryModal.jsx'
import useCustomers from './useCustomers.js'

const PAGE_SIZE = 10

function totalLabel(total) {
  return total === 1 ? '1 cliente' : `${total} clientes`
}

// `dialog` is { type: 'history' | 'edit' | 'delete', customer }
function CustomersPanel() {
  const { customer: sessionCustomer, selectCustomer, clearCustomer } = useSession()
  const [input, setInput] = useState('')
  const [query, setQuery] = useState({ search: '', page: 1 })
  const { customers, meta, loading, error, reload } = useCustomers({
    ...query,
    limit: PAGE_SIZE,
  })
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // After deleting the last customer of the last page, step back to a page that exists
  if (!loading && meta.totalPages > 0 && query.page > meta.totalPages) {
    setQuery((current) => ({ ...current, page: meta.totalPages }))
  }

  const totalPages = Math.max(meta.totalPages, 1)

  const handleSearch = (event) => {
    event.preventDefault()
    setNotice('')
    setQuery({ search: normalizeSearchTerm(input), page: 1 })
  }

  const goToPage = (page) => setQuery((current) => ({ ...current, page }))

  const openDialog = (type, customer) => {
    setNotice('')
    setDeleteError(null)
    setDialog({ type, customer })
  }

  const closeDialog = () => setDialog(null)

  const finish = (message) => {
    setDialog(null)
    setNotice(message)
    reload()
  }

  // Keep the customer chosen for the current sale in sync with the edit
  const handleSaved = (updated) => {
    if (sessionCustomer?._id === updated._id) selectCustomer(updated)
    finish('Cliente actualizado')
  }

  const handleDelete = async () => {
    const { customer } = dialog
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteCustomer(customer._id)
      if (sessionCustomer?._id === customer._id) clearCustomer()
      finish('Cliente eliminado')
    } catch (requestError) {
      setDeleteError(requestError)
    } finally {
      setDeleting(false)
    }
  }

  let content
  if (loading && customers.length === 0) {
    content = <p className="management__message">Cargando clientes…</p>
  } else if (error && customers.length === 0) {
    content = null
  } else if (customers.length === 0) {
    content = (
      <p className="management__message">
        {query.search ? `No hay clientes que coincidan con «${query.search}».` : 'Todavía no hay clientes.'}
      </p>
    )
  } else {
    content = (
      <div className="data-table__wrapper">
        <table className="data-table">
          <caption className="visually-hidden">Clientes</caption>
          <thead>
            <tr>
              <th scope="col">Cliente</th>
              <th scope="col">Teléfono</th>
              <th scope="col">Correo</th>
              <th scope="col" className="data-table__number">
                Compras
              </th>
              <th scope="col" className="data-table__actions-header">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer._id} data-testid="customer-row">
                <td>
                  <span className="data-table__primary">{customer.name}</span>
                </td>
                <td className="data-table__nowrap">{formatPhone(customer.phone)}</td>
                <td>{customer.email}</td>
                <td className="data-table__number">{customer.purchasesCount ?? 0}</td>
                <td>
                  <div className="data-table__actions">
                    <IconButton
                      icon="history"
                      label={`Ver compras de ${customer.name}`}
                      onClick={() => openDialog('history', customer)}
                    />
                    <IconButton
                      icon="edit"
                      label={`Editar ${customer.name}`}
                      onClick={() => openDialog('edit', customer)}
                    />
                    <IconButton
                      icon="trash"
                      label={`Eliminar ${customer.name}`}
                      onClick={() => openDialog('delete', customer)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <section className="management__panel" aria-label="Clientes">
      <form className="management__toolbar" onSubmit={handleSearch} role="search" noValidate>
        <Input
          className="management__search"
          label="Buscar cliente"
          name="customerSearch"
          type="search"
          placeholder="Nombre, teléfono o correo"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <Button type="submit" variant="secondary" icon="search">
          Buscar
        </Button>
        <span className="management__count" data-testid="customer-total">
          {loading && customers.length === 0 ? '' : totalLabel(meta.total)}
        </span>
      </form>

      {notice && <Alert tone="success">{notice}</Alert>}

      {error && (
        <Alert tone="error" messages={error.details ?? []}>
          <p>{error.message}</p>
          <Button size="sm" variant="secondary" className="management__retry" onClick={reload}>
            Reintentar
          </Button>
        </Alert>
      )}

      {content}

      {meta.total > 0 && (
        <nav className="management__pagination" aria-label="Paginación de clientes">
          <Button
            size="sm"
            variant="secondary"
            disabled={query.page <= 1 || loading}
            onClick={() => goToPage(query.page - 1)}
          >
            Anterior
          </Button>
          <span>
            Página {Math.min(query.page, totalPages)} de {totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={query.page >= totalPages || loading}
            onClick={() => goToPage(query.page + 1)}
          >
            Siguiente
          </Button>
        </nav>
      )}

      {dialog?.type === 'history' && (
        <PurchaseHistoryModal customer={dialog.customer} onClose={closeDialog} />
      )}

      {dialog?.type === 'edit' && (
        <CustomerFormModal customer={dialog.customer} onClose={closeDialog} onSaved={handleSaved} />
      )}

      <ConfirmDialog
        open={dialog?.type === 'delete'}
        title="Eliminar cliente"
        message={`¿Eliminar a ${dialog?.customer?.name}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={closeDialog}
      />
    </section>
  )
}

export default CustomersPanel
