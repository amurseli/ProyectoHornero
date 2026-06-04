const AR_TIMEZONE = 'America/Argentina/Buenos_Aires'

// El backend guarda los timestamps en hora local de Argentina, pero la API los responde en UTC
// (ISO-8601 con "Z", ej "2026-06-03T02:43:55Z"). Acá los parseamos como instante UTC y los
// renderizamos en la zona del usuario. Por robustez, si llegara un valor sin zona le agregamos
// "Z" (se asume UTC); los que ya traen zona (Z o +hh:mm) se dejan intactos.
export function parseBackendInstant(value) {
  if (!value) return null
  if (value instanceof Date) return value
  let normalized = value
  if (typeof value === 'string' && value.includes('T')) {
    const hasZone = /Z$|[+-]\d{2}:?\d{2}$/.test(value)
    if (!hasZone) normalized = `${value}Z`
  }
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

// Fecha + hora de un timestamp del backend (LocalDateTime), renderizado en hora de Argentina.
export function formatDateTime(value, fallback = 'Sin fecha') {
  const date = parseBackendInstant(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: AR_TIMEZONE,
  }).format(date)
}

// ── Horario de Argentina para las campañas ──────────────────────────────────
// Las fechas de campaña (startDate/endDate) se guardan como fecha sin hora y representan las
// 00:00 de Argentina (GMT-3, sin horario de verano: 180 min detrás de UTC). Estos helpers sirven
// para mostrarle al creador, en su hora local, cuándo empieza/termina la campaña.

const ARGENTINA_OFFSET_MINUTES = 180

// ¿El navegador del usuario está en una zona horaria distinta a la de Argentina (GMT-3)?
export function browserDiffersFromArgentina() {
  return new Date().getTimezoneOffset() !== ARGENTINA_OFFSET_MINUTES
}

// Fecha calendario (YYYY-MM-DD) de un instante, según el huso de Argentina.
export function argentinaYmd(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: AR_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// Instante de las 00:00 de Argentina (GMT-3) para una fecha YYYY-MM-DD.
export function argentinaMidnight(ymd) {
  if (!ymd) return null
  const date = new Date(`${ymd}T00:00:00-03:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

// Tiempo restante de una campaña hasta su cierre (endDate a las 00:00 de Argentina, GMT-3).
// Devuelve la magnitud principal: días si falta más de un día, horas si falta menos de un día,
// y minutos si falta menos de una hora. `level` sirve para el estilo de urgencia.
const MS_DAY = 86400000
const MS_HOUR = 3600000
const MS_MIN = 60000

export function getCampaignTimeLeft(endDate, now = Date.now()) {
  let ymd = null
  if (typeof endDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(endDate)) {
    ymd = endDate.slice(0, 10)
  } else if (endDate) {
    const parsed = parseBackendInstant(endDate)
    ymd = parsed ? argentinaYmd(parsed) : null
  }
  // La campaña sigue activa durante todo el día de endDate; cierra a las 00:00 (AR) del día
  // siguiente, igual que el backend (ended cuando today.isAfter(endDate)).
  const end = argentinaMidnight(ymd)
  const ms = end ? end.getTime() + MS_DAY - now : -1

  if (!end || ms <= 0) {
    return { ended: true, value: 0, unit: 'días', text: 'Finalizada', short: 'Fin', level: 'ended' }
  }

  const level = ms <= 3 * MS_DAY ? 'urgent' : ms <= 7 * MS_DAY ? 'warning' : 'normal'

  let value, unit, short
  if (ms >= MS_DAY) {
    value = Math.floor(ms / MS_DAY)
    unit = value === 1 ? 'día' : 'días'
    short = `${value}d`
  } else if (ms >= MS_HOUR) {
    value = Math.floor(ms / MS_HOUR)
    unit = value === 1 ? 'hora' : 'horas'
    short = `${value}h`
  } else {
    value = Math.max(1, Math.floor(ms / MS_MIN))
    unit = value === 1 ? 'minuto' : 'minutos'
    short = `${value}min`
  }

  return { ended: false, value, unit, text: `${value} ${unit}`, short, level }
}

// Formatea un instante (fecha + hora) en la zona horaria local del navegador.
export function formatInBrowserTime(value, fallback = '') {
  const date = parseBackendInstant(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

// Solo fecha. Soporta dos casos:
//  - LocalDate ("2026-08-01"): es una fecha calendario sin hora, se muestra tal cual (sin
//    desfase de zona horaria).
//  - LocalDateTime (instante UTC): se convierte a la fecha correspondiente en Argentina.
export function formatDate(value, fallback = 'Sin fecha') {
  if (!value) return fallback
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(year, month - 1, day))
  }
  const date = parseBackendInstant(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: AR_TIMEZONE,
  }).format(date)
}
