import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'cypress'

const backendDir = fileURLToPath(new URL('../backend', import.meta.url))

export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  defaultCommandTimeout: 8000,
  env: { apiUrl: 'http://localhost:3000/api' },
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on) {
      // Runs the backend seed from Node instead of cy.exec, so it does not depend on the user's shell
      on('task', {
        resetDb() {
          execSync('npm run seed', { cwd: backendDir, stdio: 'ignore' })
          return null
        },
      })
    },
  },
})
