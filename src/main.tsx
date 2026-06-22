import React from 'react'
import ReactDOM from 'react-dom/client'
import { LibraryProvider } from './context/LibraryContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LibraryProvider>
      <App />
    </LibraryProvider>
  </React.StrictMode>,
)
