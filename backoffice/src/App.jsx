import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import { UserProvider } from './store/UserProvider'
import { AdminRoute, Layout } from './components'
import Login from './pages/Login/Login.jsx'
import Verifications from './pages/Verifications/Verifications.jsx'
import UsersPage from './pages/Users/Users.jsx'
import CampaignsPage from './pages/Campaigns/Campaigns.jsx'
import Curador from './pages/Curador/Curador.jsx'

function App() {
  return (
    <UserProvider>
      <Router basename="/backoffice">
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Admin-only single page with left side navigation */}
          <Route
            element={
              <AdminRoute>
                <Layout />
              </AdminRoute>
            }
          >
            <Route path="/verificaciones" element={<Verifications />} />
            <Route path="/campanas" element={<CampaignsPage />} />
            <Route path="/curador" element={<Curador />} />
            <Route path="/usuarios" element={<UsersPage />} />
            <Route path="/" element={<Navigate to="/verificaciones" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </UserProvider>
  )
}

export default App
