import { useState } from 'react'
import Alert from '../../Components/Alert/Alert.jsx'
import Badge from '../../Components/Badge/Badge.jsx'
import Button from '../../Components/Button/Button.jsx'
import ConfirmDialog from '../../Components/ConfirmDialog/ConfirmDialog.jsx'
import Input from '../../Components/Input/Input.jsx'
import Select from '../../Components/Select/Select.jsx'
import { CATEGORIES, LOW_STOCK_THRESHOLD } from '../../Api/constants.js'
import { formatCurrency } from '../../Api/format.js'
import { deleteProduct } from '../../Api/productsApi.js'
import useCatalog from '../../Api/useCatalog.js'
import IconButton from './IconButton.jsx'
import ProductFormModal from './ProductFormModal.jsx'
import StockAdjustModal from './StockAdjustModal.jsx'
import { normalizeText } from './normalizeText.js'

const ALL_CATEGORIES = ''

function getCategoryLabel(value) {
  return CATEGORIES.find((category) => category.value === value)?.label ?? value
}

function StockBadge({ stock }) {
  if (stock <= 0) return <Badge tone="muted">Agotado</Badge>
  if (stock <= LOW_STOCK_THRESHOLD) return <Badge tone="warning">Poco stock</Badge>
  return null
}

// `dialog` is { type: 'create' | 'edit' | 'stock' | 'delete', product }
function ProductsPanel() {
  const { products, loading, error, reload } = useCatalog({ includeOutOfStock: true })
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const openDialog = (type, product = null) => {
    setNotice('')
    setDeleteError(null)
    setDialog({ type, product })
  }

  const closeDialog = () => setDialog(null)

  const finish = (message) => {
    setDialog(null)
    setNotice(message)
    reload()
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteProduct(dialog.product._id)
      finish('Producto eliminado')
    } catch (requestError) {
      setDeleteError(requestError)
    } finally {
      setDeleting(false)
    }
  }

  const term = normalizeText(search)
  const visibleProducts = products.filter(
    (product) =>
      (category === ALL_CATEGORIES || product.category === category) &&
      normalizeText(product.name).includes(term),
  )

  let content
  if (loading) {
    content = <p className="management__message">Cargando productos…</p>
  } else if (error && products.length === 0) {
    content = null
  } else if (visibleProducts.length === 0) {
    content = <p className="management__message">No hay productos que coincidan.</p>
  } else {
    content = (
      <div className="data-table__wrapper">
        <table className="data-table">
          <caption className="visually-hidden">Productos</caption>
          <thead>
            <tr>
              <th scope="col">Producto</th>
              <th scope="col">Categoría</th>
              <th scope="col" className="data-table__number">
                Precio
              </th>
              <th scope="col">Stock</th>
              <th scope="col" className="data-table__actions-header">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map((product) => (
              <tr key={product._id} data-testid="product-row">
                <td>
                  <span className="data-table__primary">{product.name}</span>
                  {product.description && (
                    <small className="data-table__secondary">{product.description}</small>
                  )}
                </td>
                <td>{getCategoryLabel(product.category)}</td>
                <td className="data-table__number">{formatCurrency(product.price)}</td>
                <td>
                  <span className="data-table__stock">
                    <span data-testid="product-stock">{product.stock}</span>
                    <StockBadge stock={product.stock} />
                  </span>
                </td>
                <td>
                  <div className="data-table__actions">
                    <IconButton
                      icon="edit"
                      label={`Editar ${product.name}`}
                      onClick={() => openDialog('edit', product)}
                    />
                    <IconButton
                      icon="sliders"
                      label={`Ajustar stock de ${product.name}`}
                      onClick={() => openDialog('stock', product)}
                    />
                    <IconButton
                      icon="trash"
                      label={`Eliminar ${product.name}`}
                      onClick={() => openDialog('delete', product)}
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
    <section className="management__panel" aria-label="Productos">
      <div className="management__toolbar">
        <Input
          className="management__search"
          label="Buscar producto"
          name="productSearch"
          type="search"
          placeholder="Nombre del producto"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label="Categoría"
          name="categoryFilter"
          placeholder="Todas las categorías"
          options={CATEGORIES}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
        <Button icon="plus" className="management__new" onClick={() => openDialog('create')}>
          Nuevo producto
        </Button>
      </div>

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

      {(dialog?.type === 'create' || dialog?.type === 'edit') && (
        <ProductFormModal
          product={dialog.product}
          onClose={closeDialog}
          onSaved={() => finish(dialog.type === 'create' ? 'Producto creado' : 'Producto actualizado')}
        />
      )}

      {dialog?.type === 'stock' && (
        <StockAdjustModal
          product={dialog.product}
          onClose={closeDialog}
          onAdjusted={(updated) =>
            finish(`Stock actualizado: ${updated.name} ahora tiene ${updated.stock}`)
          }
        />
      )}

      <ConfirmDialog
        open={dialog?.type === 'delete'}
        title="Eliminar producto"
        message={`¿Eliminar «${dialog?.product?.name}» del catálogo? Esta acción no se puede deshacer. Las ventas pasadas conservan su nombre y precio.`}
        confirmLabel="Eliminar"
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={closeDialog}
      />
    </section>
  )
}

export default ProductsPanel
