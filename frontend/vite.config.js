import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // IPv4 explicit: Cypress resolves "localhost" to 127.0.0.1, while Node may bind only to ::1
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
})
