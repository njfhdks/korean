import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { syncBitmapManifest } from './vite-plugin-bitmap-manifest'

// GitHub Pages 서브경로: `VITE_BASE_PATH=/저장소이름/` (앞뒤 슬래시 포함 권장)
function ghBase(): string {
  const raw = process.env.VITE_BASE_PATH
  if (raw == null || raw === '') return '/'
  const withSlash = raw.endsWith('/') ? raw : `${raw}/`
  return withSlash.startsWith('/') ? withSlash : `/${withSlash}`
}

// https://vite.dev/config/
export default defineConfig({
  base: ghBase(),
  plugins: [syncBitmapManifest(), react(), tailwindcss()],
})
