describe('smoke', () => {
  it('redirects to the login page when there is no session', () => {
    cy.visit('/')
    cy.location('pathname').should('eq', '/login')
    cy.contains('Inicia sesión para abrir la caja.').should('be.visible')
  })

  it('sends a seller away from the management page', () => {
    cy.visitAs('/gestion', { role: 'seller' })
    cy.location('pathname').should('eq', '/clientes')
  })

  it('lets an admin into the management page', () => {
    cy.visitAs('/gestion', { role: 'admin' })
    cy.location('pathname').should('eq', '/gestion')
    cy.contains('h1', 'Gestión').should('be.visible')
  })

  it('shows the not found page for unknown routes', () => {
    cy.visit('/ruta-que-no-existe')
    cy.contains('Página no encontrada').should('be.visible')
  })

  it('reaches the backend health endpoint', () => {
    cy.request(`${Cypress.env('apiUrl')}/health`).its('body.status').should('eq', 'ok')
  })
})
