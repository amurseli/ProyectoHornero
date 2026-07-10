import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { handleOAuth2Redirect } from "../../utils/auth/oauth"
import { consumePostLoginRedirect } from "../../utils/auth/postLoginRedirect"
import { useUser } from "../../store/useUser"
import { AnimatedCheck } from "../../components/ui"
import "../auth.css"

function OAuth2Redirect() {
  const navigate = useNavigate()
  const { login } = useUser()
  const [status, setStatus] = useState("processing")

  // `login` gets a new identity on every UserProvider render, so it can't sit in
  // the dep array: calling it here would re-trigger this effect, and the second
  // pass would find the post-login redirect already consumed and fall back to "/".
  const loginRef = useRef(login)
  loginRef.current = login

  // The callback is a one-shot side effect (it consumes a single-use redirect
  // target and a single-use OAuth code). Guard it so neither a re-render nor
  // StrictMode's double-invoke can run it twice.
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const processOAuth2Callback = async () => {
      try {
        const result = await handleOAuth2Redirect()

        if (result && result.success) {
          // User data is saved, update global store
          loginRef.current(result.user)
          setStatus("success")

          const target = consumePostLoginRedirect() || "/"
          setTimeout(() => {
            navigate(target, { replace: true })
          }, 2500)
        } else if (result && result.error) {
          setStatus("error")
          console.error("OAuth2 error:", result.error)

          // Redirect to login after showing error
          setTimeout(() => {
            navigate("/login?error=" + encodeURIComponent(result.error))
          }, 2000)
        } else {
          // No OAuth callback params, redirect to login
          navigate("/login")
        }
      } catch (error) {
        console.error("Error processing OAuth2 callback:", error)
        setStatus("error")

        setTimeout(() => {
          navigate("/login?error=authentication_failed")
        }, 2000)
      }
    }

    processOAuth2Callback()
  }, [navigate])

  return (
    <div className="auth-page">
      <div className="auth-container">
        <section className="auth-card">
          {status === "processing" && (
            <div className="auth-loading">
              <div className="loading-spinner"></div>
              <h3 className="auth-loading-title">Procesando autenticación...</h3>
              <p className="auth-loading-text">Por favor esperá un momento.</p>
            </div>
          )}

          {status === "success" && (
            <div className="auth-success">
              <AnimatedCheck />
              <h3 className="auth-success-title">¡Inicio de sesión exitoso!</h3>
              <p className="auth-success-text">Redirigiendo...</p>
            </div>
          )}

          {status === "error" && (
            <div className="auth-error-state">
              <div className="auth-error-icon">✕</div>
              <h3 className="auth-error-title">Error al iniciar sesión</h3>
              <p className="auth-error-text">Redirigiendo a la página de inicio de sesión...</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default OAuth2Redirect
