import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { I18nProvider } from './context/I18nContext'
import { initTheme } from './lib/theme'
import App from './App.tsx'
import { AdBannerSlot } from './components/AdBannerSlot.tsx'
import { WebSidebarAd } from './components/WebSidebarAd.tsx'
import { PrivacyPage } from './pages/PrivacyPage.tsx'

initTheme()

const routerBasename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename}>
      <I18nProvider>
        <Routes>
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route
            path="/"
            element={
              <>
                <App />
                <WebSidebarAd />
                <AdBannerSlot />
              </>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
)
