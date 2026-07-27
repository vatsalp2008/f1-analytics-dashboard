import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ClickSpark from './reactbits/ClickSpark/ClickSpark.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClickSpark sparkColor="#e10600" sparkCount={10} sparkRadius={22} sparkSize={11} duration={500} extraScale={1.1}>
      <App />
    </ClickSpark>
  </StrictMode>,
)
