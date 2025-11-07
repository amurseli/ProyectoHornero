import './Home.css';
import DefaultButton from '$components/buttons/DefaultButton';

function Home() {

  return (
    <>
      <div className="home-background" />
      <div className="home-overlay" />
      <div className="home-content">
        <h1>Welcome to the Home Page</h1>
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