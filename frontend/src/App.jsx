import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import './App.css'
import Home from '$pages/Home/Home.jsx';
import Login from '$pages/Login/Login.jsx';
import Register from '$pages/Register/Register.jsx';
import EmailSent from '$pages/EmailSent/EmailSent.jsx';
import ForgotPassword from '$pages/ForgotPassword/ForgotPassword.jsx';
import ResetPassword from '$pages/ResetPassword/ResetPassword.jsx';
import VerifyEmail from '$pages/VerifyEmail/VerifyEmail.jsx';
import Navbar from '$components/navbar/Navbar'
import CampaignsList from '$pages/Campaigns/CampaignsList';
import MyCampaigns from '$pages/Campaigns/MyCampaigns';
import CampaignForm from '$pages/Campaigns/CampaignForm';
import OAuth2Redirect from '$pages/OAuth2Redirect/OAuth2Redirect';

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
  //const [count, setCount] = useState(0)

  return (
    <Router>
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
        <Route path="/my-campaigns" element={<MyCampaigns />} />
        <Route path="/my-campaigns/new" element={<CampaignForm />} />
        <Route path="/my-campaigns/edit/:id" element={<CampaignForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
