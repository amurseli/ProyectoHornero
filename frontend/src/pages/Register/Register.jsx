import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "../../components/ui"
import api from "../../utils/api/api"
import { saveAuth } from "../../utils/auth/auth"
import "../auth.css"

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    userName: "",
    firstName: "",
    email: "",
    password: "",
    confirm: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirm) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)
    try {
      const userData = {
        userName: formData.userName,
        firstName: formData.firstName,
        email: formData.email,
        password: formData.password,
        enabled: true
      }

      const response = await api.post('/api/users/register', userData)
      saveAuth(response, true)
      window.dispatchEvent(new Event('storage'))
      navigate("/")
    } catch (err) {
      console.error("Error al registrar:", err)
      setError(err.message || "Error al crear la cuenta. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <section className="auth-card">
          <header className="auth-header">
            <Link to="/" className="auth-logo">PROYECTO HORNERO</Link>
            <h1 className="auth-title">Creá tu cuenta</h1>
            <p className="auth-subtitle">Unite a la comunidad de creadores</p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-row">
              <div className="auth-form-group">
                <label htmlFor="userName" className="auth-label">Usuario</label>
                <input
                  id="userName"
                  name="userName"
                  className="auth-input"
                  type="text"
                  required
                  value={formData.userName}
                  onChange={handleChange}
                  placeholder="tu_usuario"
                  autoComplete="username"
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="firstName" className="auth-label">Nombre</label>
                <input
                  id="firstName"
                  name="firstName"
                  className="auth-input"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  autoComplete="given-name"
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label htmlFor="email" className="auth-label">Correo electrónico</label>
              <input
                id="email"
                name="email"
                className="auth-input"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="password" className="auth-label">Contraseña</label>
              <input
                id="password"
                name="password"
                className="auth-input"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="confirm" className="auth-label">Confirmar contraseña</label>
              <input
                id="confirm"
                name="confirm"
                className="auth-input"
                type="password"
                required
                value={formData.confirm}
                onChange={handleChange}
                placeholder="Repetí tu contraseña"
                autoComplete="new-password"
              />
            </div>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <Button type="submit" disabled={loading} className="auth-submit">
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

          <footer className="auth-footer">
            <p className="auth-footer-text">
              ¿Ya tenés cuenta?{" "}
              <Link to="/login" className="auth-footer-link">Iniciá sesión</Link>
            </p>
          </footer>
        </section>
      </div>
    </div>
  )
}

export default Register