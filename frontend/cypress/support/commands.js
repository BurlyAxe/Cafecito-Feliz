// Keys must match SESSION_KEY and CUSTOMER_KEY in src/Api/session.js
const SESSION_KEY = 'cafecito.session'
const CUSTOMER_KEY = 'cafecito.customer'

const CREDENTIALS = {
  seller: { username: 'vendedor', password: 'cafecito123' },
  admin: { username: 'admin', password: 'admin123' },
}

Cypress.Commands.add('resetDb', () => {
  cy.task('resetDb', null, { timeout: 60000 })
})

Cypress.Commands.add('apiLogin', (role = 'seller') => {
  return cy
    .request('POST', `${Cypress.env('apiUrl')}/auth/login`, CREDENTIALS[role])
    .then((response) => response.body.data)
})

Cypress.Commands.add('visitAs', (path, { role = 'seller', customerEmail } = {}) => {
  cy.apiLogin(role).then((user) => {
    const findCustomer = customerEmail
      ? cy
          .request({
            url: `${Cypress.env('apiUrl')}/customers`,
            qs: { search: customerEmail },
            headers: { 'x-user-role': user.role },
          })
          .then((response) => response.body.data[0])
      : cy.wrap(null)

    findCustomer.then((customer) => {
      cy.visit(path, {
        onBeforeLoad(win) {
          win.sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
          if (customer) win.sessionStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer))
        },
      })
    })
  })
})
