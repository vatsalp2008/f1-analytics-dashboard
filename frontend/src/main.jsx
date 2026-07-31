import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ClickSpark from './reactbits/ClickSpark/ClickSpark.jsx'
import { trackPerformance } from './utils/performance'
import { initializeTheme } from './utils/theme'

// Initialize theme on app load
initializeTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClickSpark sparkColor="#e10600" sparkCount={10} sparkRadius={22} sparkSize={11} duration={500} extraScale={1.1}>
      <App />
    </ClickSpark>
  </StrictMode>,
)

// Initialize performance monitoring
trackPerformance();

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registered'))
      .catch(err => console.warn('Service Worker registration failed:', err));
  });
}
