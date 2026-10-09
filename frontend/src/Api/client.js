import { getSession } from './session.js'
import { translateDetails, translateMessage } from './errorMessages.js'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function buildUrl(path, query) {
  const params = new URLSearchParams()
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.append(key, value)
  })
  const queryString = params.toString()
  return `${API_URL}${path}${queryString ? `?${queryString}` : ''}`
}

async function parseJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function request(path, { method = 'GET', body, query, signal } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const role = getSession()?.role
  if (role) headers['x-user-role'] = role

  let response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    if (error instanceof TypeError) {
      throw new ApiError(
        0,
        'No se pudo conectar con el servidor. Revisa que el backend esté encendido.',
      )
    }
    throw error
  }

  const payload = await parseJson(response)

  if (!response.ok) {
    throw new ApiError(
      response.status,
      translateMessage(payload?.message) ?? 'Ocurrió un error inesperado.',
      translateDetails(payload?.errors ?? []),
    )
  }

  return payload
}
