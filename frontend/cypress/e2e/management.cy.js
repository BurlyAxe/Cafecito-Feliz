import { translateDetails } from '../../src/Api/errorMessages.js'

const MARIA = 'maria.lopez@correo.com'

const productRows = () => cy.get('[data-testid=product-row]')
const productRow = (name) =>
  cy
    .contains('[data-testid=product-row] .data-table__primary', new RegExp(`^${name}$`))
    .closest('[data-testid=product-row]')
const customerRows = () => cy.get('[data-testid=customer-row]')
const customerRow = (name) =>
  cy
    .contains('[data-testid=customer-row] .data-table__primary', new RegExp(`^${name}$`))
    .closest('[data-testid=customer-row]')
const dialog = () => cy.get('[role=dialog]')
const openCustomersTab = () => cy.contains('[role=tab]', 'Clientes').click()

function findProductId(name) {
  return cy
    .apiRequest({ url: '/products', qs: { limit: 100, includeOutOfStock: true } })
    .then((response) => response.body.data.find((product) => product.name === name)._id)
}

// María has 12 purchases, so the backend applies 10%: 2 × $58 = $116 − $11.60 = $104.40
function createLatteSaleForMaria() {
  cy.apiRequest({ url: '/customers', qs: { search: MARIA } }).then(({ body }) => {
    const customerId = body.data[0]._id
    findProductId('Latte').then((productId) => {
      cy.apiRequest({
        method: 'POST',
        url: '/sales',
        body: { customerId, paymentMethod: 'cash', items: [{ productId, quantity: 2 }] },
      })
        .its('body.data.total')
        .should('eq', 104.4)
    })
  })
}

function changeLattePrice(price) {
  cy.get('button[aria-label="Editar Latte"]').click()
  dialog().within(() => {
    cy.contains('Editar producto')
    cy.get('input[name=price]').clear().type(price)
    cy.contains('button', 'Guardar cambios').click()
  })
  dialog().should('not.exist')
  cy.get('[role=status]').should('contain', 'Producto actualizado')
}

describe('management', () => {
  beforeEach(() => {
    cy.resetDb()
    cy.visitAs('/gestion', { role: 'admin', customerEmail: MARIA })
  })

  it('is only for the admin and lists every product with its stock', () => {
    cy.contains('h1', 'Gestión').should('be.visible')
    cy.contains('Administra el catálogo y los clientes.')
    cy.contains('[role=tab]', 'Productos').should('have.attr', 'aria-selected', 'true')
    productRows().should('have.length', 16)
    productRows().first().should('contain', 'Espresso').and('contain', 'Doble, 60 ml')
    productRow('Matcha helado').should('contain', 'Agotado').and('contain', 'Té')
    productRow('Chai latte').should('contain', 'Poco stock').and('contain', '$60.00')
    productRow('Espresso').should('not.contain', 'Poco stock').and('not.contain', 'Agotado')

    cy.contains('button', 'Volver a la venta').click()
    cy.location('pathname').should('eq', '/venta')

    cy.visitAs('/gestion', { role: 'seller' })
    cy.location('pathname').should('not.eq', '/gestion')
    cy.contains('h1', 'Gestión').should('not.exist')
  })

  it('filters the products by name ignoring accents and by category', () => {
    cy.get('input[name=productSearch]').type('te')
    productRows().should('have.length', 5)
    ;['Latte', 'Chai latte', 'Té verde', 'Pan de elote', 'Pastel de chocolate'].forEach((name) => {
      productRow(name).should('exist')
    })
    cy.get('input[name=productSearch]').clear().type('TÉ VERDE')
    productRows().should('have.length', 1).and('contain', 'Té verde')
    cy.get('input[name=productSearch]').clear().type('zzz')
    cy.contains('No hay productos que coincidan.')

    cy.get('input[name=productSearch]').clear()
    cy.get('select[name=categoryFilter]').select('Postres')
    productRows().should('have.length', 5)
    cy.get('input[name=productSearch]').type('pastel')
    productRows().should('have.length', 1).and('contain', 'Pastel de chocolate')
    cy.get('input[name=productSearch]').clear()
    cy.get('select[name=categoryFilter]').select('Todas las categorías')
    productRows().should('have.length', 16)
  })

  it('creates a product that then shows up in the point of sale', () => {
    cy.contains('button', 'Nuevo producto').click()
    dialog().within(() => {
      cy.contains('Nuevo producto')
      cy.contains('button', 'Crear producto').click()
      cy.contains('Escribe el nombre del producto')
      cy.contains('Elige una categoría')
      cy.contains('Escribe un precio válido')
      cy.get('input[name=name]').type('Galleta de avena')
      cy.get('input[name=description]').type('Con chispas')
      cy.get('select[name=category]').select('Postres')
      cy.get('input[name=price]').type('25')
      cy.get('input[name=stock]').clear().type('10')
      cy.contains('button', 'Crear producto').click()
    })
    dialog().should('not.exist')
    cy.get('[role=status]').should('contain', 'Producto creado')
    productRows().should('have.length', 17)
    productRows().last().should('contain', 'Galleta de avena')
    productRow('Galleta de avena')
      .should('contain', 'Con chispas')
      .and('contain', 'Postres')
      .and('contain', '$25.00')
      .find('[data-testid=product-stock]')
      .should('have.text', '10')

    cy.visitAs('/venta', { role: 'admin', customerEmail: MARIA })
    cy.contains('[data-testid=product-card]', 'Galleta de avena').should('contain', '$25.00')
  })

  it('rejects a product name that already exists, ignoring case', () => {
    cy.contains('button', 'Nuevo producto').click()
    dialog().within(() => {
      cy.get('input[name=name]').type('LATTE')
      cy.get('select[name=category]').select('Café')
      cy.get('input[name=price]').type('50')
      cy.contains('button', 'Crear producto').click()
      cy.get('[role=alert]').should('contain', 'Ya existe un producto con ese nombre')
      cy.contains('button', 'Cancelar').click()
    })
    productRows().should('have.length', 16)
  })

  it('validates the price in the form and the backend rejects a negative one', () => {
    cy.intercept('POST', '**/products').as('createProduct')
    cy.contains('button', 'Nuevo producto').click()
    dialog().within(() => {
      cy.get('input[name=name]').type('Prueba')
      cy.get('select[name=category]').select('Café')
      cy.get('input[name=price]').type('-1')
      cy.get('input[name=stock]').clear().type('1.5')
      cy.contains('button', 'Crear producto').click()
      cy.contains('Escribe un precio válido')
      cy.contains('El stock debe ser un número entero')
    })
    cy.get('@createProduct.all').should('have.length', 0)

    findProductId('Latte').then((id) => {
      cy.apiRequest({
        method: 'PUT',
        url: `/products/${id}`,
        body: { name: 'Latte', description: '12 oz', category: 'coffee', price: -1 },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(translateDetails(response.body.errors)).to.include(
          'El campo precio no puede ser negativo',
        )
      })
    })
  })

  it('edits a product price', () => {
    productRow('Latte').should('contain', '$58.00')
    changeLattePrice('60')
    productRow('Latte').should('contain', '$60.00')
  })

  it('adjusts the stock and explains when there are not enough units', () => {
    productRow('Muffin de arándano').should('contain', 'Poco stock')
    cy.get('button[aria-label="Ajustar stock de Muffin de arándano"]').click()
    dialog().within(() => {
      cy.get('[data-testid=current-stock]').should('have.text', '3')
      cy.contains('label', 'Quitar').click()
      cy.get('input[name=quantity]').type('5')
      cy.contains('button', 'Aplicar ajuste').click()
      cy.get('[role=alert]').should('contain', 'No puedes quitar 5 unidades: solo hay 3')

      cy.contains('label', 'Agregar').click()
      cy.get('input[name=quantity]').clear().type('7')
      cy.get('[data-testid=stock-preview]').should('have.text', 'Nuevo stock: 10')
      cy.contains('button', 'Aplicar ajuste').click()
    })
    dialog().should('not.exist')
    cy.get('[role=status]').should(
      'contain',
      'Stock actualizado: Muffin de arándano ahora tiene 10',
    )
    productRow('Muffin de arándano')
      .should('not.contain', 'Poco stock')
      .find('[data-testid=product-stock]')
      .should('have.text', '10')
  })

  it('deletes a product after confirming', () => {
    cy.get('button[aria-label="Eliminar Cheesecake de fresa"]').click()
    dialog().within(() => {
      cy.contains('Eliminar producto')
      cy.contains('¿Eliminar «Cheesecake de fresa» del catálogo?')
      cy.contains('button', 'Eliminar').click()
    })
    dialog().should('not.exist')
    cy.get('[role=status]').should('contain', 'Producto eliminado')
    productRows().should('have.length', 15)
    cy.contains('Cheesecake de fresa').should('not.exist')
  })

  it('keeps the customers tab on reload and searches on the server', () => {
    openCustomersTab()
    cy.location('search').should('eq', '?tab=clientes')
    cy.reload()
    cy.contains('[role=tab]', 'Clientes').should('have.attr', 'aria-selected', 'true')
    cy.get('[data-testid=customer-total]').should('have.text', '3 clientes')
    customerRows().should('have.length', 3)
    customerRow('María López').should('contain', '449 123 4567').and('contain', '12')
    cy.contains('Página 1 de 1')

    cy.get('input[name=customerSearch]').type('carlos')
    cy.contains('button', 'Buscar').click()
    customerRows().should('have.length', 1).and('contain', 'Carlos Ruiz')
    cy.get('[data-testid=customer-total]').should('have.text', '1 cliente')

    cy.contains('[role=tab]', 'Productos').click()
    cy.location('search').should('eq', '')
    productRows().should('have.length', 16)
  })

  it('searches customers by name ignoring accents', () => {
    openCustomersTab()
    cy.get('input[name=customerSearch]').type('maria lopez')
    cy.contains('button', 'Buscar').click()
    customerRows().should('have.length', 1).and('contain', 'María López')
    cy.get('input[name=customerSearch]').clear().type('RUÍZ')
    cy.contains('button', 'Buscar').click()
    customerRows().should('have.length', 1).and('contain', 'Carlos Ruiz')
  })

  it('has the backend reject a phone without 10 digits', () => {
    cy.apiRequest({ url: '/customers', qs: { search: MARIA } }).then(({ body }) => {
      const { _id: id, name, email } = body.data[0]
      cy.apiRequest({
        method: 'PUT',
        url: `/customers/${id}`,
        body: { name, email, phone: '449 123' },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(translateDetails(response.body.errors)).to.deep.eq([
          'El teléfono debe tener 10 dígitos',
        ])
      })
    })
  })

  it('edits a customer and rejects a duplicated email', () => {
    cy.visitAs('/gestion?tab=clientes', { role: 'admin', customerEmail: MARIA })
    cy.get('button[aria-label="Editar Carlos Ruiz"]').click()
    dialog().within(() => {
      cy.get('input[name=email]').clear().type('maria.lopez@correo.com')
      cy.contains('button', 'Guardar cambios').click()
      cy.get('[role=alert]').should('contain', 'Ya existe un cliente con ese correo')
      cy.contains('button', 'Cancelar').click()
    })
    dialog().should('not.exist')

    cy.get('button[aria-label="Editar Carlos Ruiz"]').click()
    dialog().within(() => {
      cy.get('input[name=email]').should('have.value', 'carlos.ruiz@correo.com')
      cy.get('input[name=phone]').clear().type('449 555')
      cy.contains('button', 'Guardar cambios').click()
      cy.contains('El teléfono debe tener 10 dígitos')
      cy.get('input[name=phone]').clear().type('449 555 0000')
      cy.contains('button', 'Guardar cambios').click()
    })
    dialog().should('not.exist')
    cy.get('[role=status]').should('contain', 'Cliente actualizado')
    customerRow('Carlos Ruiz').should('contain', '449 555 0000')
  })

  it('shows the purchase history and blocks deleting a customer with sales', () => {
    createLatteSaleForMaria()
    cy.visitAs('/gestion?tab=clientes', { role: 'admin', customerEmail: MARIA })
    customerRow('María López').should('contain', '13')

    cy.get('button[aria-label="Ver compras de Ana Torres"]').click()
    dialog().within(() => {
      cy.contains('Compras de Ana Torres')
      cy.contains('Este cliente todavía no tiene compras.')
      cy.contains('button', 'Cerrar').click()
    })

    cy.get('button[aria-label="Ver compras de María López"]').click()
    dialog().within(() => {
      cy.contains('Compras de María López')
      cy.get('[data-testid=purchase]').should('have.length', 1)
      cy.contains(/Folio [0-9A-F]{6}/)
      cy.contains('Efectivo')
      cy.contains('Latte × 2')
      cy.contains('.purchase__row', 'Descuento (10%)').should('contain', '$11.60')
      cy.get('[data-testid=purchase-total]').should('have.text', '$104.40')
      cy.contains('button', 'Cerrar').click()
    })

    cy.get('button[aria-label="Eliminar María López"]').click()
    dialog().within(() => {
      cy.contains('¿Eliminar a María López? Esta acción no se puede deshacer.')
      cy.contains('button', 'Eliminar').click()
      cy.get('[role=alert]').should(
        'contain',
        'No se puede eliminar un cliente que tiene ventas registradas',
      )
      cy.contains('button', 'Eliminar').should('not.be.disabled')
      cy.contains('button', 'Cancelar').click()
    })
    dialog().should('not.exist')
    customerRows().should('have.length', 3)

    cy.get('button[aria-label="Eliminar Ana Torres"]').click()
    dialog().contains('button', 'Eliminar').click()
    dialog().should('not.exist')
    cy.get('[role=status]').should('contain', 'Cliente eliminado')
    cy.get('[data-testid=customer-total]').should('have.text', '2 clientes')
    customerRows().should('have.length', 2)
    cy.contains('Ana Torres').should('not.exist')
  })

  it('keeps the price of past sales after the product price changes', () => {
    createLatteSaleForMaria()
    changeLattePrice('99')
    productRow('Latte').should('contain', '$99.00')

    openCustomersTab()
    cy.get('button[aria-label="Ver compras de María López"]').click()
    dialog().within(() => {
      cy.contains('.purchase__line', 'Latte × 2')
        .should('contain', '$116.00')
        .and('contain', '$58.00 c/u')
        .and('not.contain', '$198.00')
      cy.get('[data-testid=purchase-total]').should('have.text', '$104.40')
    })
  })
})
