import { request } from './client.js'

export const searchCustomers = ({ search, page = 1, limit = 10 } = {}) =>
  request('/customers', { query: { search, page, limit } })

export const fetchCustomer = (id) => request(`/customers/${id}`)

export const createCustomer = (customer) =>
  request('/customers', { method: 'POST', body: customer })

export const updateCustomer = (id, changes) =>
  request(`/customers/${id}`, { method: 'PUT', body: changes })

export const deleteCustomer = (id) => request(`/customers/${id}`, { method: 'DELETE' })

export const fetchCustomerPurchases = (id) => request(`/customers/${id}/purchases`)

export const fetchCustomerFavorite = (id) => request(`/customers/${id}/favorite`)
