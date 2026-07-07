import { CheckCircle2, Circle } from 'lucide-react'
import { evaluatePassword } from '../../utils/passwordPolicy'
import './PasswordRequirements.css'

/**
 * Checklist en vivo con los requisitos de la contraseña. Cada regla se marca
 * en verde a medida que se cumple. Pensado para ir debajo de un input de
 * contraseña nueva.
 */
function PasswordRequirements({ password = '' }) {
  const { checks } = evaluatePassword(password)

  return (
    <ul className="password-reqs" aria-live="polite">
      {checks.map((check) => (
        <li
          key={check.id}
          className={`password-reqs-item ${check.valid ? 'is-valid' : ''}`}
        >
          {check.valid ? (
            <CheckCircle2 size={15} aria-hidden="true" />
          ) : (
            <Circle size={15} aria-hidden="true" />
          )}
          <span>{check.label}</span>
        </li>
      ))}
    </ul>
  )
}

export default PasswordRequirements
