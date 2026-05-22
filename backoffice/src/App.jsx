import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import { UserProvider } from './store/UserProvider'
import { AdminRoute, Layout } from './components'
import Login from './pages/Login/Login.jsx'
import Verifications from './pages/Verifications/Verifications.jsx'

function App() {
  return (
    <UserProvider>
      <BrowserRouter basename="/backoffice"></BrowserRouter>
      <Router>
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
            <Route path="/" element={<Navigate to="/verificaciones" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </UserProvider>
  )
}

export default App
