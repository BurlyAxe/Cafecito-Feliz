import { request } from './client.js'

export const quoteCart = ({ customerId, items }, { signal } = {}) =>
  request('/sales/cart', { method: 'POST', body: { customerId, items }, signal })

export const createSale = ({ customerId, paymentMethod, items }) =>
  request('/sales', { method: 'POST', body: { customerId, paymentMethod, items } })

