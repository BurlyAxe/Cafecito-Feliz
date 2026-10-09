import { request } from './client.js'

export const login = ({ username, password }) =>
  request('/auth/login', { method: 'POST', body: { username, password } })
