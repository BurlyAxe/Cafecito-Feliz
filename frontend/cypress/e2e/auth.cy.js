import { translateMessage } from '../../src/Api/errorMessages.js'

const SESSION_KEY = 'cafecito.session'
const ANA = 'ana.torres@correo.com'

const api = (path) => `${Cypress.env('apiUrl')}${path}`

// Rewrites the role inside the token payload but keeps the original signature
function withForgedRole(token, role) {
  const [header, payload, signature] = token.split('.')
  const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  const forged = btoa(JSON.stringify({ ...claims, role }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return [header, forged, signature].join('.')
}

describe('authentication', () => {
  before(() => {
    cy.resetDb()
  })

  it('rejects protected requests without a token, even with the old role header', () => {
    cy.request({ url: api('/customers'), failOnStatusCode: false }).then((response) => {
      expect(response.status).to.eq(401)
      expect(translateMessage(response.body.message)).to.eq('Inicia sesión para continuar')
    })
    cy.request({
      url: api('/customers'),
      headers: { 'x-user-role': 'admin' },
      failOnStatusCode: false,
    })
      .its('status')
      .should('eq', 401)
  })

  it('rejects a token whose role was edited by hand', () => {
    cy.apiLogin('seller').then(({ token }) => {
      const forged = withForgedRole(token, 'admin')
      cy.request({
        url: api('/customers'),
        auth: { bearer: forged },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401)
        expect(translateMessage(response.body.message)).to.eq(
          'Tu sesión expiró. Vuelve a iniciar sesión.',
        )
      })
      // On the public catalog a forged token is ignored: no out of stock products
      cy.request({
        url: api('/products'),
        qs: { limit: 100, includeOutOfStock: true },
        auth: { bearer: forged },
      })
        .its('body.data')
        .should('have.length', 15)
    })
  })

  it('rejects an expired token', () => {
    cy.task('createExpiredToken', 'admin').then((token) => {
      cy.request({ url: api('/customers'), auth: { bearer: token }, failOnStatusCode: false })
        .its('status')
        .should('eq', 401)
    })
  })

  it('answers 403 when the role is not enough', () => {
    cy.apiRequest({ url: '/customers', qs: { search: ANA } }).then(({ body }) => {
      const id = body.data[0]._id
      cy.apiRequest({ method: 'DELETE', url: `/customers/${id}`, failOnStatusCode: false }, 'seller')
        .its('status')
        .should('eq', 403)
      cy.apiRequest({ method: 'DELETE', url: `/customers/${id}` }, 'admin')
        .its('body.data.name')
        .should('eq', 'Ana Torres')
    })
  })

  it('sends the user back to the login page when the session expired', () => {
    cy.visitAs('/clientes', { role: 'seller' })
    cy.task('createExpiredToken', 'seller').then((token) => {
      cy.window().then((win) => {
        const session = JSON.parse(win.sessionStorage.getItem(SESSION_KEY))
        win.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, token }))
      })
    })
    cy.get('input[name=search]').type('4491234567')
    cy.contains('button', 'Buscar').click()
    cy.location('pathname').should('eq', '/login')
    cy.contains('Tu sesión expiró. Vuelve a iniciar sesión.').should('be.visible')
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem(SESSION_KEY)).to.eq(null)
    })
  })

  it('ignores a stored session without a token', () => {
    cy.visit('/clientes', {
      onBeforeLoad(win) {
        win.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ name: 'Admin', role: 'admin' }))
      },
    })
    cy.location('pathname').should('eq', '/login')
  })
})
