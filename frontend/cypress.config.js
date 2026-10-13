import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'cypress'

const backendDir = fileURLToPath(new URL('../backend', import.meta.url))

// jsonwebtoken and JWT_SECRET come from the backend, so the tests sign tokens exactly like it does
const jwt = createRequire(new URL('../backend/package.json', import.meta.url))('jsonwebtoken')
const readJwtSecret = () =>
  readFileSync(new URL('../backend/.env', import.meta.url), 'utf8').match(/^JWT_SECRET=(.+)$/m)?.[1].trim()

export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  defaultCommandTimeout: 8000,
  env: { apiUrl: 'http://localhost:3000/api' },
  e2e: {
    // 127.0.0.1 (not localhost) matches the IPv4 host pinned in vite.config.js
    baseUrl: 'http://127.0.0.1:5173',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on) {
      on('task', {
        // Runs the backend seed from Node instead of cy.exec, so it does not depend on the user's shell
        resetDb() {
          execSync('npm run seed', { cwd: backendDir, stdio: 'ignore' })
          return null
        },
        // A correctly signed token that expired a minute ago
        createExpiredToken(role) {
          const exp = Math.floor(Date.now() / 1000) - 60
          return jwt.sign({ sub: 'cypress', name: 'Cypress', role, exp }, readJwtSecret())
        },
      })
    },
  },
})
