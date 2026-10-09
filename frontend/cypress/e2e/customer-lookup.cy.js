const CUSTOMER_KEY = 'cafecito.customer'

function search(term) {
  cy.get('input[name=search]').clear().type(term)
  cy.contains('button', 'Buscar').click()
}

describe('customer lookup', () => {
  beforeEach(() => {
    cy.resetDb()
    cy.visitAs('/clientes', { role: 'seller' })
  })

  it('finds a customer by formatted phone and starts a sale', () => {
    search('449 123 4567')
    cy.get('[data-testid=customer-result]').within(() => {
      cy.contains('María López')
      cy.contains('12 compras')
      cy.contains('10%')
    })
    cy.contains('button', 'Iniciar venta').click()
    cy.location('pathname').should('eq', '/venta')
    cy.window().then((win) => {
      expect(JSON.parse(win.sessionStorage.getItem(CUSTOMER_KEY)).name).to.eq('María López')
    })
  })

  it('finds a customer by email ignoring case', () => {
    search('CARLOS.RUIZ@correo.com')
    cy.get('[data-testid=customer-result]').within(() => {
      cy.contains('Carlos Ruiz')
      cy.contains('3 compras')
      cy.contains('Aún sin descuento')
    })
  })

  it('shows when a customer has no favorite product', () => {
    search('4495550199')
    cy.get('[data-testid=customer-result]').within(() => {
      cy.contains('Ana Torres')
      cy.contains('Todavía no tiene producto favorito')
    })
  })

  it('rejects a short phone without sending a request', () => {
    cy.intercept('GET', '**/customers?*').as('customers')
    search('44955')
    cy.contains('El teléfono debe tener 10 dígitos').should('be.visible')
    cy.get('@customers.all').should('have.length', 0)
  })

  it('lists several matches and lets the seller pick one', () => {
    search('correo.com')
    cy.get('[data-testid=customer-list]').within(() => {
      cy.contains('Encontramos 3 clientes')
      cy.get('button').should('have.length', 3)
      cy.contains('button', 'Ana Torres').click()
    })
    cy.get('[data-testid=customer-result]').should('contain', 'Ana Torres')
  })

  it('registers a new customer when none is found', () => {
    search('4490000000')
    cy.contains('No encontramos a ningún cliente con «4490000000».').should('be.visible')
    cy.get('[data-testid=new-customer-form]').within(() => {
      cy.get('input[name=phone]').should('have.value', '4490000000')
      cy.get('input[name=email]').type('pedro@')
      cy.contains('button', 'Registrar cliente').click()
      cy.contains('Escribe el nombre').should('be.visible')
      cy.contains('Escribe un correo válido').should('be.visible')
      cy.get('input[name=name]').type('Pedro Gómez')
      cy.get('input[name=email]').clear().type('Pedro.Gomez@correo.com')
      cy.contains('button', 'Registrar cliente').click()
    })
    cy.contains('Cliente registrado').should('be.visible')
    cy.get('[data-testid=customer-result]').within(() => {
      cy.contains('Pedro Gómez')
      cy.contains('pedro.gomez@correo.com')
      cy.contains('0 compras')
    })
  })

  it('shows the backend error for a duplicate email', () => {
    search('4490000001')
    cy.get('[data-testid=new-customer-form]').within(() => {
      cy.get('input[name=name]').type('Otra María')
      cy.get('input[name=email]').type('maria.lopez@correo.com')
      cy.contains('button', 'Registrar cliente').click()
    })
    cy.contains('Ya existe un cliente con ese correo').should('be.visible')
  })

  it('hides the registration form on cancel', () => {
    search('4490000000')
    cy.contains('button', 'Cancelar').click()
    cy.get('[data-testid=new-customer-form]').should('not.exist')
  })

  it('asks for a term when the search is empty', () => {
    cy.contains('button', 'Buscar').click()
    cy.contains('Escribe un teléfono o un correo').should('be.visible')
  })

  it('offers to continue the sale in progress', () => {
    cy.visitAs('/clientes', { role: 'seller', customerEmail: 'maria.lopez@correo.com' })
    cy.contains('Venta en curso con María López').should('be.visible')
    cy.contains('button', 'Continuar venta').click()
    cy.location('pathname').should('eq', '/venta')
  })

  it('lets an admin search customers too', () => {
    cy.visitAs('/clientes', { role: 'admin' })
    search('María')
    cy.get('[data-testid=customer-result]').should('contain', 'María López')
  })
})
