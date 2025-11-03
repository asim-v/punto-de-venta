// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { CinePOSProvider } from './state/CinePOSProvider.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CinePOSProvider>
      <App />
    </CinePOSProvider>
  </React.StrictMode>,
)
