// Shared form rules + helpers for the campaign creation wizard and the
// draft-edit "Básicos" section, so both validate and format identically.

export const TITLE_MAX       = 80
export const SHORT_DESC_MAX  = 200
export const DURATION_MIN    = 1
export const DURATION_MAX    = 60
export const GOAL_MIN        = 1000          // $ 1.000
export const GOAL_MAX        = 10_000_000    // $ 10.000.000
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024   // 10 MB
export const CROP_ASPECT     = 16 / 9

// ── Duration ───────────────────────────────────────────────────────────────
// Keep digits only and clamp to the maximum; empty string is allowed mid-typing.
export function sanitizeDuration(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (digits === '') return ''
  return String(Math.min(DURATION_MAX, parseInt(digits, 10)))
}

// ── Money amounts — Argentine format "1.234,56" (dot thousands, comma decimal)
// Formats the raw input as the user types, preserving a trailing comma and
// allowing up to two decimal places.
export function formatAmountInput(raw) {
  if (raw == null) return ''
  const s = String(raw).replace(/[^\d,]/g, '')
  const firstComma = s.indexOf(',')

  let intPart, decPart, hasComma
  if (firstComma === -1) {
    intPart = s; decPart = ''; hasComma = false
  } else {
    intPart = s.slice(0, firstComma)
    decPart = s.slice(firstComma + 1).replace(/,/g, '').slice(0, 2)
    hasComma = true
  }

  intPart = intPart.replace(/^0+(?=\d)/, '')          // strip leading zeros
  if (intPart === '') intPart = hasComma ? '0' : ''
  if (intPart !== '' && Number(intPart) > GOAL_MAX) intPart = String(GOAL_MAX)

  const groupedInt = intPart === '' ? '' : Number(intPart).toLocaleString('es-AR')
  return groupedInt + (hasComma ? ',' + decPart : '')
}

// Parse an es-AR amount string ("1.234,56") into a Number.
export function parseAmount(str) {
  if (str == null || str === '') return NaN
  return Number(String(str).replace(/\./g, '').replace(',', '.'))
}

// Format a stored Number back into the es-AR input string.
export function amountToInput(n) {
  if (n == null || n === '' || Number.isNaN(Number(n))) return ''
  const num = Number(n)
  const hasDecimals = Math.round(num * 100) % 100 !== 0
  return num.toLocaleString('es-AR', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })
}

// Human-readable money for hints/labels (no decimals): "$ 1.000".
export function formatMoney(n, symbol = '$') {
  return `${symbol} ${Number(n).toLocaleString('es-AR')}`
}
