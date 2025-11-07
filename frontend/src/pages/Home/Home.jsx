import './Home.css';
import DefaultButton from '$components/buttons/DefaultButton';

function Home() {

  return (
    <>
      <div className="home-background" />
      <div className="home-overlay" />
      <div className="home-content">
        <div className="home-hero-headings">
          <h1>Proyecto Hornero</h1>
          <h3>Plataforma de financiación colectiva para proyectos</h3>
        </div>
        <div className="home-buttons">
          <DefaultButton
            type="button"
            destination="/login"
            content='Iniciar Sesión'
            secondary
          />
          <DefaultButton
            type="button"
            content='Registrarse'
            destination="/register"
          />
        </div>
      </div>
    </>
  );
}

export default Home;