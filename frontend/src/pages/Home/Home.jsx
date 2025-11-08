import './Home.css';
import DefaultButton from '$components/buttons/DefaultButton';

function Home() {

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
              src="/src/assets/images/hornero.jpg" 
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