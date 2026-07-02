import { ArrowRight } from "lucide-react"
import "./HeroButton.css"

// ─────────────────────────────────────────────────────────────────────────────
//  HeroButton — botón pill blanco con backlight cálido (rojo→amarillo) que
//  explota al hover. Reutilizable (hero, CTA, etc.).
//    <HeroButton onClick={...}>Crear mi campaña</HeroButton>
//  Props: icon (default true → flecha), className, y cualquier prop de <button>.
// ─────────────────────────────────────────────────────────────────────────────

function HeroButton({ children, icon = true, className = "", ...props }) {
  return (
    <button className={`hero-btn ${className}`.trim()} {...props}>
      <span className="hero-btn-label">{children}</span>
      {icon && <ArrowRight size={18} strokeWidth={2.2} className="hero-btn-icon" />}
    </button>
  )
}

export default HeroButton
