import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import './App.css'
import { UserProvider } from './store/UserProvider';
import { useUser } from './store/useUser';
import api from './utils/api/api';

// Pages
import Home from '$pages/Home/Home.jsx';
import Login from '$pages/Login/Login.jsx';
import Register from '$pages/Register/Register.jsx';
import ForgotPassword from '$pages/ForgotPassword/ForgotPassword.jsx';
import ResetPassword from '$pages/ResetPassword/ResetPassword.jsx';
import VerifyEmail from '$pages/VerifyEmail/VerifyEmail.jsx';
import EmailSent from '$pages/EmailSent/EmailSent.jsx';
import OAuth2Redirect from '$pages/OAuth2Redirect/OAuth2Redirect.jsx';
import CampaignsList from '$pages/Campaigns/CampaignsList';
import MyCampaigns from '$pages/Campaigns/MyCampaigns';
import CreateCampaign from '$pages/Campaigns/CreateCampaign';
import ForCreators from '$pages/ForCreators/ForCreators.jsx';
import BecomeCreator from '$pages/BecomeCreator/BecomeCreator.jsx';
import UserConfig from '$pages/UserConfig/UserConfig';
import ConfirmEmailChange from '$pages/ConfirmEmailChange/ConfirmEmailChange';

// Components
import Footer from '$components/layout/footer/Footer'
import Navbar from '$components/layout/navbar/Navbar.jsx';
import ProtectedRoute from '$components/ProtectedRoute';
import CreatorRoute from '$components/CreatorRoute';

function AuthVerifier() {
  const location = useLocation()
  const { user } = useUser()

  useEffect(() => {
    const isAuthPage = location.pathname.includes('/login') || 
                       location.pathname.includes('/register')
    
    if (user && !isAuthPage) {
      api.get('/api/users/me').catch(() => {})
    }
  }, [location.pathname, user])

  return null
}

function App() {
  return (
    <UserProvider>
      <Router>
        <AuthVerifier />
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/confirm-email-change" element={<ConfirmEmailChange />} />
          <Route path="/email-sent" element={<EmailSent />} />
          <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
          <Route path="/campaigns" element={<CampaignsList />} />
          <Route path="/for-creators" element={<ForCreators />} />

          {/* Protected */}
          <Route path="/my-campaigns" element={<CreatorRoute><MyCampaigns /></CreatorRoute>} />
          <Route path="/my-campaigns/new" element={<CreatorRoute><CreateCampaign /></CreatorRoute>} />
          <Route path="/become-creator" element={<ProtectedRoute><BecomeCreator /></ProtectedRoute>} />
          <Route path="/configuracion" element={<ProtectedRoute><UserConfig /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </Router>
    </UserProvider>
  )
}

export default App