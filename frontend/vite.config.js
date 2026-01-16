import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Plugin to copy index.html to 404.html after build (for SPA routing on static hosts)
const copy404Plugin = () => {
  return {
    name: 'copy-404',
    writeBundle() {
      const distPath = path.join(__dirname, 'dist')
      const indexPath = path.join(distPath, 'index.html')
      const notFoundPath = path.join(distPath, '404.html')
      
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath)
        console.log('✅ Copied index.html to 404.html for SPA routing')
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copy404Plugin()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
