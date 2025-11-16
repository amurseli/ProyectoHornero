import './Home.css';
import DefaultButton from '$components/buttons/DefaultButton';
import { Icon } from '@iconify/react';

function Home() {
  const googleOauth = () => {
    // window.location.href = import.meta.env.VITE_API_URL + '/auth/google';
  }

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="main-card">
          {/* Login Card */}
          <section className="login-card">
          <header className="card-header">
            <h1 className="card-title">Bienvenido a Proyecto Hornero</h1>
            <p className="card-subtitle">
              Plataforma de financiación colectiva<br /> para proyectos
            </p>
          </header>
          <div className="home-buttons">
            <button className="google-button" onClick={googleOauth} aria-label="Iniciar sesión con Google">
              <div className="button-content">
                <Icon icon="devicon:google" width="20" height="20" className="google-icon" />
                <span className="button-text">Iniciar sesión con Google</span>
              </div>
            </button>
            <DefaultButton
              type="button"
              destination="/login"
              content={'Iniciar Sesión'}
              secondary
            />
            <DefaultButton
              type="button"
              content={'Registrarse'}
              destination="/register"
            />
          </div>
        </section>
        {/* Logo Section */}
        <section className="logo-section">
          <div className="logo-container">
            <img 
              src="/src/lib/assets/images/hornero.jpg" 
              className="logo" 
              alt="Proyecto Hornero Logo" 
            />
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}

export default Home;