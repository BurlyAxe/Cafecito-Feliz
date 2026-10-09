import { useEffect, useState } from 'react'
import Button from '../../Components/Button/Button.jsx'
import { DISCOUNT_TIERS } from '../../Api/constants.js'
import { fetchCustomerFavorite } from '../../Api/customersApi.js'
import { formatPhone, getInitials } from '../../Api/format.js'

function getDiscountLine(purchasesCount) {
  const tier = DISCOUNT_TIERS.find((item) => purchasesCount >= item.minPurchases)
  if (tier) return `Descuento de cliente frecuente: ${tier.percent}%`
  const lowest = DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1]
  return `Aún sin descuento (a partir de ${lowest.minPurchases} compras)`
}

function CustomerResultCard({ customer, onStartSale }) {
  const [favorite, setFavorite] = useState({ id: null, value: undefined })

  useEffect(() => {
    let cancelled = false
    fetchCustomerFavorite(customer._id)
      .then(({ data }) => {
        if (!cancelled) setFavorite({ id: customer._id, value: data })
      })
      .catch(() => {
        if (!cancelled) setFavorite({ id: customer._id, value: undefined })
      })
    return () => {
      cancelled = true
    }
  }, [customer._id])

  const purchases = customer.purchasesCount ?? 0
  let favoriteLine = null
  if (favorite.id !== customer._id) favoriteLine = 'Cargando favorito…'
  else if (favorite.value === null) favoriteLine = 'Todavía no tiene producto favorito'
  else if (favorite.value) {
    favoriteLine = `Su favorito: ${favorite.value.productName} (pidió ${favorite.value.totalQuantity})`
  }

  return (
    <article className="customer-card" data-testid="customer-result">
      <span className="customer-card__avatar" aria-hidden="true">
        {getInitials(customer.name)}
      </span>
      <div className="customer-card__body">
        <h2 className="customer-card__name">{customer.name}</h2>
        <p className="customer-card__line">{formatPhone(customer.phone)}</p>
        <p className="customer-card__line">{customer.email}</p>
        <p className="customer-card__line">
          {purchases === 1 ? '1 compra' : `${purchases} compras`}
        </p>
        <p className="customer-card__line">{getDiscountLine(purchases)}</p>
        {favoriteLine && <p className="customer-card__line">{favoriteLine}</p>}
      </div>
      <Button onClick={() => onStartSale(customer)}>Iniciar venta</Button>
    </article>
  )
}

export default CustomerResultCard
