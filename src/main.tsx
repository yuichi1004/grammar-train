import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { scheduleUpdateChecks } from './lib/pwaUpdate'

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (registration) scheduleUpdateChecks(registration)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
