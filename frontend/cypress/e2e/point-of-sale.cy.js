const CUSTOMER_KEY = 'cafecito.customer'
const CART_KEY = 'cafecito.cart'
const MARIA = 'maria.lopez@correo.com'
const CARLOS = 'carlos.ruiz@correo.com'

const cards = () => cy.get('[data-testid=product-card]')
const card = (name) =>
  cy
    .contains('[data-testid=product-card] h3', new RegExp(`^${name}$`))
    .closest('[data-testid=product-card]')
const addProduct = (name) => cy.get(`button[aria-label="Agregar ${name}"]`).click()
const cartPanel = () => cy.get('[data-testid=cart-panel]')
const checkoutButton = () => cartPanel().contains('button', 'Cobrar')

function findProductId(name) {
  return cy
    .request(`${Cypress.env('apiUrl')}/products?limit=100&includeOutOfStock=true`, {
      headers: { 'x-user-role': 'admin' },
    })
    .then((response) => response.body.data.find((product) => product.name === name)._id)
}

function chargeWith(method) {
  checkoutButton().should('not.be.disabled').click()
  cy.get('[role=dialog]').within(() => {
    cy.contains('button', 'Confirmar cobro').should('be.disabled')
    cy.contains('label', method).click()
    cy.contains('button', 'Confirmar cobro').should('not.be.disabled').click()
  })
}

describe('point of sale', () => {
  beforeEach(() => {
    cy.resetDb()
  })

  it('shows the seller only the available products without stock details', () => {
    cy.visitAs('/venta', { role: 'seller', customerEmail: MARIA })
    cards().should('have.length', 15)
    cards().first().should('contain', 'Espresso')
    cy.contains('Matcha helado').should('not.exist')
    cy.contains('en stock').should('not.exist')
    cy.contains('poco stock').should('not.exist')
    cy.get('[data-testid=customer-chip]')
      .should('contain', 'María López')
      .and('contain', '449 123 4567')
    cy.get('[data-testid=role-badge]').should('contain', 'Vendedor')
    cy.contains('a', 'Gestión').should('not.exist')
  })

  it('shows the admin every product with its stock', () => {
    cy.visitAs('/venta', { role: 'admin', customerEmail: MARIA })
    cards().should('have.length', 16)
    cy.get('[data-testid=low-stock-pill]').should('have.text', '3 productos con poco stock')
    card('Chai latte').should('contain', 'Quedan 4')
    card('Muffin de arándano').should('contain', 'Quedan 3')
    card('Espresso').should('contain', '40 en stock')
    card('Matcha helado').should('contain', 'Agotado')
    cy.get('button[aria-label="Agregar Matcha helado"]').should('be.disabled')
    card('Matcha helado').click()
    cartPanel().should('contain', 'Toca un producto para agregarlo.')
    cartPanel().should('contain', '0 artículos')
  })

  it('filters the products by category', () => {
    cy.visitAs('/venta', { role: 'admin', customerEmail: MARIA })
    cards().should('have.length', 16)
    cy.contains('[role=tab]', 'Té').click()
    cy.contains('[role=tab]', 'Té').should('have.attr', 'aria-selected', 'true')
    cards().should('have.length', 4)
    ;['Chai latte', 'Matcha helado', 'Té verde', 'Tisana de frutos rojos'].forEach((name) => {
      card(name).should('exist')
    })
    cy.contains('[role=tab]', 'Postres').click()
    cards().should('have.length', 5)
    cy.contains('[role=tab]', 'Café').click()
    cards().should('have.length', 7)
    cy.contains('[role=tab]', 'Todos').click()
    cards().should('have.length', 16)
  })

  it('shows the totals calculated by the backend with the customer discount', () => {
    cy.intercept('POST', '**/sales/cart').as('quote')
    cy.visitAs('/venta', { role: 'seller', customerEmail: MARIA })
    addProduct('Latte')
    addProduct('Latte')
    addProduct('Croissant')
    cy.wait('@quote')
    cartPanel().within(() => {
      cy.contains('3 artículos')
      cy.contains('.cart-panel__row', 'Subtotal').should('contain', '$161.00')
      cy.contains('.cart-panel__row', 'Descuento (10%)').should('contain', '−$16.10')
      cy.get('[data-testid=cart-total]').should('have.text', '$144.90')
      cy.contains('button', 'Cobrar $144.90').should('not.be.disabled')
      cy.contains('Descuento de cliente frecuente aplicado')
    })
  })

  it('applies no discount to a customer with few purchases', () => {
    cy.intercept('POST', '**/sales/cart').as('quote')
    cy.visitAs('/venta', { role: 'seller', customerEmail: CARLOS })
    addProduct('Espresso')
    cy.wait('@quote')
    cartPanel().within(() => {
      cy.get('[data-testid=cart-total]').should('have.text', '$38.00')
      cy.contains('button', 'Cobrar $38.00')
      cy.contains('Descuento (').should('not.exist')
      cy.contains('Descuento de cliente frecuente aplicado').should('not.exist')
    })
  })

  it('changes quantities with the stepper and removes lines', () => {
    cy.visitAs('/venta', { role: 'seller', customerEmail: MARIA })
    addProduct('Latte')
    cy.get('[data-testid=cart-line]').within(() => {
      cy.get('[data-testid=quantity-value]').should('have.text', '1')
      cy.get('button[aria-label^="Quitar uno"]').should('be.disabled')
      cy.get('button[aria-label^="Agregar uno"]').click()
      cy.get('[data-testid=quantity-value]').should('have.text', '2')
      cy.get('button[aria-label^="Quitar uno"]').should('not.be.disabled').click()
      cy.get('[data-testid=quantity-value]').should('have.text', '1')
      cy.get('button[aria-label^="Quitar uno"]').should('be.disabled')
      cy.get('button[aria-label="Quitar Latte"]').click()
    })
    cy.get('[data-testid=cart-line]').should('not.exist')
    cartPanel().should('contain', 'Toca un producto para agregarlo.')
    checkoutButton().should('be.disabled')
  })

  it('registers a cash sale and shows the receipt', () => {
    cy.visitAs('/venta', { role: 'seller', customerEmail: MARIA })
    addProduct('Espresso')
    addProduct('Espresso')
    cartPanel().contains('button', 'Cobrar $68.40')
    chargeWith('Efectivo')
    cy.get('[role=dialog]').within(() => {
      cy.contains('Venta registrada')
      cy.contains(/Folio [0-9A-F]{6}/)
      cy.contains('María López')
      cy.contains('Espresso × 2')
      cy.get('[data-testid=receipt-total]').should('have.text', '$68.40')
      cy.get('[data-testid=receipt-payment]').should('have.text', 'Efectivo')
      cy.contains('button', 'Nueva venta (mismo cliente)').click()
    })
    cy.get('[role=dialog]').should('not.exist')
    cartPanel().should('contain', 'Toca un producto para agregarlo.')
    cy.window().then((win) => {
      expect(JSON.parse(win.sessionStorage.getItem(CUSTOMER_KEY)).purchasesCount).to.eq(13)
    })
    findProductId('Espresso').then((id) => {
      cy.request(`${Cypress.env('apiUrl')}/products/${id}`).its('body.data.stock').should('eq', 38)
    })
  })

  it('explains a stock shortage found at checkout', () => {
    cy.visitAs('/venta', { role: 'admin', customerEmail: MARIA })
    addProduct('Chai latte')
    addProduct('Chai latte')
    addProduct('Chai latte')
    checkoutButton().should('contain', 'Cobrar $162.00').and('not.be.disabled')
    findProductId('Chai latte').then((id) => {
      cy.request({
        method: 'PATCH',
        url: `${Cypress.env('apiUrl')}/products/${id}/stock`,
        headers: { 'x-user-role': 'admin' },
        body: { delta: -3 },
      })
    })
    chargeWith('Tarjeta')
    cy.get('[role=dialog]').within(() => {
      cy.contains('No hay stock suficiente')
      cy.contains('Stock insuficiente de "Chai latte": pediste 3, hay 1')
      cy.contains('button', 'Confirmar cobro').should('exist')
      cy.contains('button', 'Cancelar').click()
    })
    cy.get('[role=dialog]').should('not.exist')
    cy.get('[data-testid=cart-line]').should('contain', 'Solo hay 1 disponibles')
    checkoutButton().should('be.disabled')
    card('Chai latte').should('contain', 'Quedan 1')
  })

  it('warns the seller about missing stock from the quote', () => {
    cy.visitAs('/venta', { role: 'seller', customerEmail: CARLOS })
    addProduct('Muffin de arándano')
    addProduct('Muffin de arándano')
    addProduct('Muffin de arándano')
    addProduct('Muffin de arándano')
    cy.get('[data-testid=quantity-value]').should('have.text', '4')
    cy.get('[data-testid=cart-line]').should('contain', 'Solo hay 3 disponibles')
    checkoutButton().should('be.disabled')
  })

  it('shows the quote error when a product in the cart was deleted', () => {
    cy.visitAs('/venta', { role: 'seller', customerEmail: MARIA })
    addProduct('Espresso')
    checkoutButton().should('contain', 'Cobrar $34.20')
    findProductId('Espresso').then((id) => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/products/${id}`,
        headers: { 'x-user-role': 'admin' },
      })
    })
    addProduct('Latte')
    cartPanel().within(() => {
      cy.get('[role=alert]').should('contain', 'No se encontró el producto')
      cy.contains('Uno de los productos ya no existe en el catálogo')
      cy.contains('button', 'Cobrar').should('be.disabled')
      cy.get('button[aria-label="Quitar Espresso"]').click()
      cy.get('[role=alert]').should('not.exist')
      cy.contains('button', 'Cobrar $52.20').should('not.be.disabled')
    })
  })

  it('caps the admin at the known stock', () => {
    cy.visitAs('/venta', { role: 'admin', customerEmail: CARLOS })
    addProduct('Muffin de arándano')
    addProduct('Muffin de arándano')
    addProduct('Muffin de arándano')
    addProduct('Muffin de arándano')
    cy.get('[data-testid=quantity-value]').should('have.text', '3')
    cy.get('button[aria-label^="Agregar uno"]').click()
    cy.get('[data-testid=quantity-value]').should('have.text', '3')
    checkoutButton().should('contain', 'Cobrar $126.00').and('not.be.disabled')
  })

  it('serves another customer after a sale', () => {
    cy.visitAs('/venta', { role: 'seller', customerEmail: MARIA })
    addProduct('Americano')
    chargeWith('Transferencia')
    cy.contains('button', 'Atender a otro cliente').click()
    cy.location('pathname').should('eq', '/clientes')
    cy.contains('Venta en curso').should('not.exist')
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem(CUSTOMER_KEY)).to.eq(null)
      expect(JSON.parse(win.sessionStorage.getItem(CART_KEY) ?? '[]')).to.have.length(0)
    })
  })

  it('keeps the cart when changing the customer', () => {
    cy.intercept('POST', '**/sales/cart').as('quote')
    cy.visitAs('/venta', { role: 'seller', customerEmail: MARIA })
    addProduct('Espresso')
    cartPanel().contains('button', 'Cobrar $34.20')
    cy.get('[data-testid=customer-chip]').contains('Cambiar').click()
    cy.location('pathname').should('eq', '/clientes')
    cy.contains('button', 'Continuar venta').click()
    cy.location('pathname').should('eq', '/venta')
    cy.get('[data-testid=cart-line]').should('have.length', 1).and('contain', 'Espresso')

    cy.get('[data-testid=customer-chip]').contains('Cambiar').click()
    cy.get('input[name=search]').type('carlos.ruiz@correo.com')
    cy.contains('button', 'Buscar').click()
    cy.contains('button', 'Iniciar venta').click()
    cy.location('pathname').should('eq', '/venta')
    cy.get('[data-testid=customer-chip]').should('contain', 'Carlos Ruiz')
    cy.get('[data-testid=cart-line]').should('have.length', 1).and('contain', 'Espresso')
    cartPanel().contains('button', 'Cobrar $38.00')
  })

  it('keeps the cart on reload and clears it on sign out', () => {
    cy.visitAs('/venta', { role: 'seller', customerEmail: MARIA })
    addProduct('Mocha')
    addProduct('Mocha')
    cy.get('[data-testid=quantity-value]').should('have.text', '2')
    cy.reload()
    cy.get('[data-testid=cart-line]').should('contain', 'Mocha')
    cy.get('[data-testid=quantity-value]').should('have.text', '2')
    cartPanel().should('contain', '2 artículos')
    cy.contains('button', 'Salir').click()
    cy.location('pathname').should('eq', '/login')
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem(CART_KEY)).to.eq(null)
    })
  })
})
