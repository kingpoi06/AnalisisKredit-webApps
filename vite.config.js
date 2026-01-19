import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: {
  //   host: '191.69.1.24', // atau '0.0.0.0'
  //   port: 5173,
  // }
})
