import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import DefaultButton from '$components/buttons/DefaultButton'
import './EmailSent.css'

function EmailSent() {
  const location = useLocation()
  const email = location.state?.email || ''

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <section className="content-card auth-card">
          <div className="email-sent-message">
            <div className="email-icon">📧</div>
            <h2>¡Verifica tu email!</h2>
            <p className="main-message">
              Te hemos enviado un correo de verificación a:
            </p>
            <p className="email-address"><strong>{email}</strong></p>
            <p className="instructions">
              Por favor revisa tu bandeja de entrada y haz clic en el enlace de verificación 
              para activar tu cuenta. El enlace es válido por 24 horas.
            </p>
            <div className="tips">
              <p className="tip-title">¿No ves el correo?</p>
              <ul className="tip-list">
                <li>Revisa tu carpeta de spam o correo no deseado</li>
                <li>Asegúrate de que la dirección de email sea correcta</li>
                <li>El correo puede tardar unos minutos en llegar</li>
              </ul>
            </div>
            <div className="form-actions">
              <Link to="/login">
                <DefaultButton content="Ir a inicio de sesión" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default EmailSent
