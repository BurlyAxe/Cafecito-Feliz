// One story through the real UI only: a seller sells, then an admin checks the result.
// María has 12 purchases, so she gets 10%: (2 × $58 + $45) = $161 − $16.10 = $144.90

const dialog = () => cy.get('[role=dialog]')
const cartPanel = () => cy.get('[data-testid=cart-panel]')

function signIn(username, password) {
  cy.get('input[name=username]').type(username)
  cy.get('input[name=password]').type(password)
  cy.contains('button', 'Entrar').click()
  cy.location('pathname').should('eq', '/clientes')
}

function startSaleFor(term, name) {
  cy.get('input[name=search]').type(term)
  cy.contains('button', 'Buscar').click()
  cy.get('[data-testid=customer-result]').should('contain', name)
  cy.contains('button', 'Iniciar venta').click()
  cy.location('pathname').should('eq', '/venta')
}

const productRow = (name) =>
  cy
    .contains('[data-testid=product-row] .data-table__primary', new RegExp(`^${name}$`))
    .closest('[data-testid=product-row]')

const customerRow = (name) =>
  cy
    .contains('[data-testid=customer-row] .data-table__primary', new RegExp(`^${name}$`))
    .closest('[data-testid=customer-row]')

describe('full flow', () => {
  before(() => {
    cy.resetDb()
  })

  it('sells as a seller and reviews the sale as an admin', () => {
    cy.visit('/login')

    // Seller: find María and sell her two lattes and a croissant
    signIn('vendedor', 'cafecito123')
    cy.get('[data-testid=role-badge]').should('contain', 'Vendedor')
    cy.contains('a', 'Gestión').should('not.exist')
    startSaleFor('449 123 4567', 'María López')

    cy.get('button[aria-label="Agregar Latte"]').click()
    cy.get('button[aria-label="Agregar Latte"]').click()
    cy.get('button[aria-label="Agregar Croissant"]').click()
    cy.get('[data-testid=cart-line]').should('have.length', 2)
    cy.get('[data-testid=cart-total]').should('have.text', '$144.90')

    cartPanel().contains('button', 'Cobrar').should('not.be.disabled').click()
    dialog().within(() => {
      cy.contains('label', 'Efectivo').click()
      cy.contains('button', 'Confirmar cobro').click()
    })
    dialog().within(() => {
      cy.contains('Venta registrada')
      cy.get('[data-testid=receipt-total]').should('have.text', '$144.90')
      cy.contains('button', 'Atender a otro cliente').click()
    })
    dialog().should('not.exist')
    cy.location('pathname').should('eq', '/clientes')

    cy.contains('button', 'Salir').click()
    cy.location('pathname').should('eq', '/login')

    // Admin: the stock, the purchases count and the history reflect the sale
    signIn('admin', 'admin123')
    cy.get('[data-testid=role-badge]').should('contain', 'Administrador')
    startSaleFor('maria.lopez@correo.com', 'María López')

    cy.contains('a', 'Gestión').click()
    cy.location('pathname').should('eq', '/gestion')
    productRow('Latte').find('[data-testid=product-stock]').should('have.text', '28')
    productRow('Croissant').find('[data-testid=product-stock]').should('have.text', '13')

    cy.contains('[role=tab]', 'Clientes').click()
    customerRow('María López').should('contain', '13')

    cy.get('button[aria-label="Ver compras de María López"]').click()
    dialog().within(() => {
      cy.get('[data-testid=purchase]').should('have.length', 1)
      cy.contains('Latte × 2')
      cy.contains('Croissant × 1')
      cy.get('[data-testid=purchase-total]').should('have.text', '$144.90')
      cy.contains('button', 'Cerrar').click()
    })
    dialog().should('not.exist')

    cy.get('button[aria-label="Eliminar María López"]').click()
    dialog().within(() => {
      cy.contains('button', 'Eliminar').click()
      cy.get('[role=alert]').should(
        'contain',
        'No se puede eliminar un cliente que tiene ventas registradas',
      )
      cy.contains('button', 'Cancelar').click()
    })
    dialog().should('not.exist')
    customerRow('María López').should('exist')
  })
})
