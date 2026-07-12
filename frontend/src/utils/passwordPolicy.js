/**
 * Reglas de contraseña segura. Se muestran al usuario como una checklist en
 * vivo (ver components/PasswordRequirements) y se validan antes de enviar el
 * formulario en Register, ResetPassword y UserConfig.
 */
export const PASSWORD_POLICY = {
  minLength: 8,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /\d/,
  special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
}

// BCrypt (usado por el backend) sólo considera los primeros 72 bytes: limitamos
// la entrada para que el usuario no escriba una contraseña que se truncaría.
export const PASSWORD_MAX_LENGTH = 72

const RULES = [
  {
    id: 'minLength',
    label: `Al menos ${PASSWORD_POLICY.minLength} caracteres`,
    test: (pwd) => pwd.length >= PASSWORD_POLICY.minLength,
  },
  {
    id: 'uppercase',
    label: 'Una letra mayúscula',
    test: (pwd) => PASSWORD_POLICY.uppercase.test(pwd),
  },
  {
    id: 'lowercase',
    label: 'Una letra minúscula',
    test: (pwd) => PASSWORD_POLICY.lowercase.test(pwd),
  },
  {
    id: 'number',
    label: 'Un número',
    test: (pwd) => PASSWORD_POLICY.number.test(pwd),
  },
  {
    id: 'special',
    label: 'Un carácter especial',
    test: (pwd) => PASSWORD_POLICY.special.test(pwd),
  },
]

/** Evalúa una contraseña contra cada regla, devolviendo el detalle y la validez global. */
export function evaluatePassword(pwd = '') {
  const checks = RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    valid: rule.test(pwd),
  }))
  return {
    checks,
    allValid: checks.every((c) => c.valid),
  }
}
