const SESSION_KEY = 'cafecito.session'

function submitLogin(username, password) {
  if (username) cy.get('input[name=username]').type(username)
  if (password) cy.get('input[name=password]').type(password)
  cy.contains('button', 'Entrar').click()
}

describe('login', () => {
  before(() => {
    cy.resetDb()
  })

  beforeEach(() => {
    cy.visit('/login')
  })

  it('signs a seller in', () => {
    submitLogin('vendedor', 'cafecito123')
    cy.location('pathname').should('eq', '/clientes')
    cy.get('[data-testid=role-badge]').should('contain', 'Vendedor')
    cy.window().then((win) => {
      expect(JSON.parse(win.sessionStorage.getItem(SESSION_KEY)).role).to.eq('seller')
    })
  })

  it('signs an admin in ignoring case and spaces', () => {
    submitLogin(' ADMIN ', 'admin123')
    cy.location('pathname').should('eq', '/clientes')
    cy.get('[data-testid=role-badge]').should('contain', 'Administrador')
    cy.contains('a', 'Gestión').should('be.visible')
  })

  it('rejects a wrong password', () => {
    submitLogin('vendedor', 'incorrecta')
    cy.location('pathname').should('eq', '/login')
    cy.contains('Usuario o contraseña incorrectos').should('be.visible')
  })

  it('rejects an unknown user', () => {
    submitLogin('nadie', 'cafecito123')
    cy.location('pathname').should('eq', '/login')
    cy.contains('Usuario o contraseña incorrectos').should('be.visible')
  })

  it('validates empty fields without sending a request', () => {
    cy.intercept('POST', '**/auth/login').as('login')
    cy.contains('button', 'Entrar').click()
    cy.contains('Escribe tu usuario').should('be.visible')
    cy.contains('Escribe tu contraseña').should('be.visible')
    cy.get('@login.all').should('have.length', 0)
  })

  it('redirects to login when visiting a protected page without session', () => {
    cy.visit('/venta')
    cy.location('pathname').should('eq', '/login')
  })

  it('sends a signed-in user from login to the customers page', () => {
    cy.visitAs('/login')
    cy.location('pathname').should('eq', '/clientes')
  })

  it('clears the session on sign out', () => {
    cy.visitAs('/clientes')
    cy.contains('button', 'Salir').click()
    cy.location('pathname').should('eq', '/login')
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem(SESSION_KEY)).to.eq(null)
    })
    cy.visit('/clientes')
    cy.location('pathname').should('eq', '/login')
  })

  it('hides the management link from a seller', () => {
    cy.visitAs('/clientes', { role: 'seller' })
    cy.get('[data-testid=role-badge]').should('contain', 'Vendedor')
    cy.contains('a', 'Gestión').should('not.exist')
  })

  it('shows a message when the backend is unreachable', () => {
    cy.intercept('POST', '**/auth/login', { forceNetworkError: true })
    submitLogin('vendedor', 'cafecito123')
    cy.contains('No se pudo conectar con el servidor').should('be.visible')
  })
})
