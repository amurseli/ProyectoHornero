import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css'
import Home from '$pages/Home/Home.jsx';
import Login from '$pages/Login/Login.jsx';
import Register from '$pages/Register/Register.jsx';
import Navbar from '$components/layout/navbar/Navbar.jsx';
import CampaignsList from '$pages/Campaigns/CampaignsList';
import MyCampaigns from '$pages/Campaigns/MyCampaigns';
import CampaignForm from '$pages/Campaigns/CampaignForm';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/campaigns" element={<CampaignsList />} />
        <Route path="/my-campaigns" element={<MyCampaigns />} />
        <Route path="/my-campaigns/new" element={<CampaignForm />} />
        <Route path="/my-campaigns/edit/:id" element={<CampaignForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App