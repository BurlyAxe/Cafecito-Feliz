import { useNavigate, useSearchParams } from 'react-router'
import AppHeader from '../../Components/AppHeader/AppHeader.jsx'
import Button from '../../Components/Button/Button.jsx'
import CategoryTabs from '../../Components/CategoryTabs/CategoryTabs.jsx'
import CustomersPanel from './CustomersPanel.jsx'
import ProductsPanel from './ProductsPanel.jsx'
import '../../Styles/pages/management-page.css'

const TABS = {
  PRODUCTS: 'productos',
  CUSTOMERS: 'clientes',
}

const TAB_OPTIONS = [
  { value: TABS.PRODUCTS, label: 'Productos' },
  { value: TABS.CUSTOMERS, label: 'Clientes' },
]

function ManagementPage() {
  const navigate = useNavigate()
  // The tab lives in the URL (?tab=clientes) so a reload keeps it
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === TABS.CUSTOMERS ? TABS.CUSTOMERS : TABS.PRODUCTS

  const handleTabChange = (nextTab) => {
    setSearchParams(nextTab === TABS.CUSTOMERS ? { tab: nextTab } : {}, { replace: true })
  }

  return (
    <>
      <AppHeader />
      <main className="management">
        <div className="management__header">
          <div>
            <h1 className="management__title">Gestión</h1>
            <p className="management__subtitle">Administra el catálogo y los clientes.</p>
          </div>
          <Button variant="ghost" icon="arrow-left" onClick={() => navigate('/venta')}>
            Volver a la venta
          </Button>
        </div>

        <CategoryTabs
          label="Secciones de gestión"
          options={TAB_OPTIONS}
          value={tab}
          onChange={handleTabChange}
        />

        {tab === TABS.PRODUCTS ? <ProductsPanel /> : <CustomersPanel />}
      </main>
    </>
  )
}

export default ManagementPage
