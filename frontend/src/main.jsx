import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Fonts from './assets/fonts/fontFaces';
import Theme from './assets/commons/Theme';
import { ThemeStore } from './assets/commons/Theme/store.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Fonts />
    <ThemeStore>
      <Theme>
        <App />
      </Theme>
    </ThemeStore>
  </StrictMode>,
)

// Checkear si reportWebVitals nos sirve
// import reportWebVitals from './reportWebVitals'
// reportWebVitals();