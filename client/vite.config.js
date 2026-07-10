import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Force the dev server to bind to the IPv4 loopback explicitly. By
    // default Vite binds to whatever "localhost" resolves to, and on some
    // Macs that resolves to the IPv6 loopback (::1) only - which leaves
    // http://127.0.0.1:5173 completely unreachable (curl/browser get
    // "connection refused") even though the server is genuinely running.
    // Pinning host to 127.0.0.1 here guarantees it's actually listening on
    // the address this whole project standardises on (see .env.example
    // comments re: macOS Screen Time blocking the word "localhost").
    host: '127.0.0.1',
    port: 5173,
  },
})
