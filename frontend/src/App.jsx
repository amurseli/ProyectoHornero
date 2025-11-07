import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import './App.css'
import Home from './pages/Home/Home.jsx';
import Login from './pages/Login/Login.jsx';
import Register from './pages/Register/Register.jsx';
import Navbar from '$components/navbar/Navbar'

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
