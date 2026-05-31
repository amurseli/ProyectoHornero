import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import './App.css'
import { UserProvider } from './store/UserProvider';
import { useUser } from './store/useUser';
import api from './utils/api/api';
import { clearPostLoginRedirect } from './utils/auth/postLoginRedirect';

// Pages
import Home from '$pages/Home/Home.jsx';
import Login from '$pages/Login/Login.jsx';
import Register from '$pages/Register/Register.jsx';
import ForgotPassword from '$pages/ForgotPassword/ForgotPassword.jsx';
import ResetPassword from '$pages/ResetPassword/ResetPassword.jsx';
import VerifyEmail from '$pages/VerifyEmail/VerifyEmail.jsx';
import EmailSent from '$pages/EmailSent/EmailSent.jsx';
import OAuth2Redirect from '$pages/OAuth2Redirect/OAuth2Redirect.jsx';
import MyCampaigns from '$pages/Campaigns/MyCampaigns';
import SavedCampaigns from '$pages/SavedCampaigns/SavedCampaigns';
import CreateCampaign from '$pages/Campaigns/CreateCampaign';
import ForCreators from '$pages/ForCreators/ForCreators.jsx';
import BecomeCreator from '$pages/BecomeCreator/BecomeCreator.jsx';
import UserConfig from '$pages/UserConfig/UserConfig';
import ConfirmEmailChange from '$pages/ConfirmEmailChange/ConfirmEmailChange';
import CampaignPage from '$pages/CampaignPage/CampaignPage';
import EditDraftCampaign from '$pages/Campaigns/EditDraftCampaign';
import CreatorCampaignDashboard from '$pages/Campaigns/CreatorCampaignDashboard';
import TransactionHistory from '$pages/TransactionHistory/TransactionHistory.jsx';
import PaymentReturn from '$pages/PaymentReturn/PaymentReturn.jsx'
import BrowseCampaigns from '$pages/Browse/BrowseCampaigns.jsx';
import UnderConstruction from '$pages/UnderConstruction/UnderConstruction.jsx';
import HowItWorks from '$pages/HowItWorks/HowItWorks.jsx';

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

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// Drops any pending post-login redirect target when the user leaves the auth funnel.
// /oauth2/redirect is included because Google bounces through it before landing on the target.
function AuthRedirectCleaner() {
  const { pathname } = useLocation()
  useEffect(() => {
    const inAuthFunnel =
      pathname.startsWith('/login') ||
      pathname.startsWith('/register') ||
      pathname.startsWith('/oauth2/redirect')
    if (!inAuthFunnel) clearPostLoginRedirect()
  }, [pathname])
  return null
}

function App() {
  return (
    <UserProvider>
      <Router>
        <AuthVerifier />
        <AuthRedirectCleaner />
        <ScrollToTop />
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
          <Route path="/campaigns/:id" element={<CampaignPage />} />
          <Route path="/campaign/:username/:titleSlug" element={<CampaignPage />} />
          <Route path="/explorar" element={<BrowseCampaigns />} />
          <Route path="/for-creators" element={<ForCreators />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/payment/return" element={<PaymentReturn />} />
          <Route path="/help" element={<UnderConstruction />} />
          <Route path="/contact" element={<UnderConstruction />} />
          <Route path="/about" element={<UnderConstruction />} />
          <Route path="/terms" element={<UnderConstruction />} />
          <Route path="/privacy" element={<UnderConstruction />} />
          <Route path="/cookies" element={<UnderConstruction />} />

          {/* Protected */}
          <Route path="/my-campaigns" element={<ProtectedRoute><MyCampaigns /></ProtectedRoute>} />
          <Route path="/my-saved-campaigns" element={<ProtectedRoute><SavedCampaigns /></ProtectedRoute>} />
          <Route path="/my-campaigns/new" element={<ProtectedRoute><CreateCampaign /></ProtectedRoute>} />
          <Route path="/become-creator" element={<ProtectedRoute><BecomeCreator /></ProtectedRoute>} />
          <Route path="/configuracion" element={<ProtectedRoute><UserConfig /></ProtectedRoute>} />
          <Route path="/my-campaigns/:id/manage" element={<ProtectedRoute><CreatorCampaignDashboard /></ProtectedRoute>} />
          <Route path="/my-campaigns/:id/edit" element={<ProtectedRoute><EditDraftCampaign /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </Router>
    </UserProvider>
  )
}

export default App
