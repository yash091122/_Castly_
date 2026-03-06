import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './tailwind.css'
import './styles/responsive.css';
import './styles/pages-responsive.css';
import './styles/watch-party-responsive.css';
import './styles/admin-responsive.css';
import './styles/content-card-responsive.css';
import './styles/responsive-utilities.css';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  // Temporarily disable StrictMode to prevent double socket connections in development
  // StrictMode causes useEffect to run twice which disconnects/reconnects sockets
  <App />
)
