import {BrowserRouter as Router, Route, Routes, Navigate, useLocation} from 'react-router-dom';
import { useEffect } from 'react';
import { useUser } from '$lib/store/useUser';
import api from '$utils/api/api';
import './App.css'

// Pages
import Home from '$pages/Home/Home.jsx';
import Login from '$pages/Login/Login.jsx';
import Register from '$pages/Register/Register.jsx';
import EmailSent from '$pages/EmailSent/EmailSent.jsx';
import ForgotPassword from '$pages/ForgotPassword/ForgotPassword.jsx';
import ResetPassword from '$pages/ResetPassword/ResetPassword.jsx';
import VerifyEmail from '$pages/VerifyEmail/VerifyEmail.jsx';
import OAuth2Redirect from '$pages/OAuth2Redirect/OAuth2Redirect';
import CampaignsList from '$pages/Campaigns/CampaignsList';
import MyCampaigns from '$pages/Campaigns/MyCampaigns';
import CampaignForm from '$pages/Campaigns/CampaignForm';

// Components
import Navbar from '$components/navbar/Navbar'
import ProtectedRoute from '$components/ProtectedRoute';

/**
 * AuthVerifier - Verifies JWT on every navigation
 * Triggers api.js interceptor which handles refresh automatically
 * Similar to SvelteKit's hooks.server.ts
 */
function AuthVerifier() {
  const location = useLocation()
  const { user } = useUser()

  useEffect(() => {
    // Only verify if user is logged in and not on auth pages
    const isAuthPage = location.pathname.includes('/login') || 
                       location.pathname.includes('/register')
    
    if (user && !isAuthPage) {
      // Trigger JWT check - api.js will refresh if needed
      api.get('/api/users/me').catch(() => {
        // Errors handled by api.js (logout + redirect)
      })
    }
  }, [location.pathname, user])

  return null
}

// function Popover({ children, content }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const popoverRef = useRef(null);

//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (popoverRef.current && !popoverRef.current.contains(event.target)) {
//         setIsOpen(false);
//       }
//     }

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   return (
//     <div ref={popoverRef} style={{ position: 'relative' }}>
//       <div
//         onMouseEnter={() => setIsOpen(true)}
//         onMouseLeave={() => setIsOpen(false)}
//         aria-haspopup="true"
//         aria-expanded={isOpen}
//       >
//         {children}
//       </div>
//       <PopoverContent className={isOpen ? 'active' : ''} role="tooltip">
//         {content}
//       </PopoverContent>
//     </div>
//   );
// }

// NavbarContent removed — use the extracted Navbar component instead

function App() {
  return (
    <Router>
      <AuthVerifier />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/email-sent" element={<EmailSent />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
        <Route path="/campaigns" element={<CampaignsList />} />
        <Route path="/my-campaigns" element={<ProtectedRoute><MyCampaigns /></ProtectedRoute>} />
        <Route path="/my-campaigns/new" element={<ProtectedRoute><CampaignForm /></ProtectedRoute>} />
        <Route path="/my-campaigns/edit/:id" element={<ProtectedRoute><CampaignForm /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
