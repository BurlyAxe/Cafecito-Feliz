import { request } from './client.js'

// The backend caps a page at 100 products, more than a café menu needs
export const fetchProducts = ({ includeOutOfStock = false } = {}) =>
  request('/products', {
    query: { limit: 100, includeOutOfStock: includeOutOfStock ? 'true' : undefined },
  })

export const createProduct = (product) => request('/products', { method: 'POST', body: product })

export const updateProduct = (id, changes) =>
  request(`/products/${id}`, { method: 'PUT', body: changes })

export const adjustStock = (id, delta) =>
  request(`/products/${id}/stock`, { method: 'PATCH', body: { delta } })

export const deleteProduct = (id) => request(`/products/${id}`, { method: 'DELETE' })
