import { Link, useLocation } from "react-router-dom"
import { Button } from "../../components/ui"
import "../auth.css"

function EmailSent() {
  const location = useLocation()
  const email = location.state?.email || ""

  return (
    <div className="auth-page">
      <div className="auth-container">
        <section className="auth-card">
          <div className="auth-success">
            <div className="auth-email-icon">📧</div>
            <h2 className="auth-success-title">¡Verificá tu email!</h2>
            <p className="auth-success-text">
              Te hemos enviado un correo de verificación a:
            </p>
            <p className="auth-email-address"><strong>{email}</strong></p>
            <p className="auth-success-text">
              Por favor revisá tu bandeja de entrada y hacé clic en el enlace de verificación
              para activar tu cuenta. El enlace es válido por 24 horas.
            </p>
            <div className="auth-tips">
              <p className="auth-tips-title">¿No ves el correo?</p>
              <ul className="auth-tips-list">
                <li>Revisá tu carpeta de spam o correo no deseado</li>
                <li>Asegurate de que la dirección de email sea correcta</li>
                <li>El correo puede tardar unos minutos en llegar</li>
              </ul>
            </div>
            <Link to="/login">
              <Button className="auth-submit">Ir a inicio de sesión</Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export default EmailSent
