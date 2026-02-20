import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  // Temporarily disable StrictMode to prevent double socket connections in development
  // StrictMode causes useEffect to run twice which disconnects/reconnects sockets
  <App />
)
