// Shared form rules + helpers for the campaign creation wizard and the
// draft-edit "Básicos" section, so both validate and format identically.

export const TITLE_MAX       = 80
export const SHORT_DESC_MAX  = 200
export const DURATION_MIN    = 1
export const DURATION_MAX    = 150       // 5 meses
export const GOAL_MIN        = 1_000        // $ 1.000
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

// ── Vista previa "monto a recibir" ──────────────────────────────────────────
// Replica la fórmula de PayoutService (payments): cada comisión se redondea a
// 2 decimales por separado antes de restarla del bruto.
function round2(n) {
  return Math.round(n * 100) / 100
}

// Dado el monto a recaudar (bruto), estima cuánto recibiría el creador si la
// campaña llega exactamente a esa meta y no la supera.
export function computeNetAmount(grossAmount, feeRates) {
  if (!Number.isFinite(grossAmount) || !feeRates) return NaN
  const { platformRate, providerRate } = feeRates
  const platformFee = round2(grossAmount * platformRate)
  const providerFee = round2(grossAmount * providerRate)
  return round2(grossAmount - platformFee - providerFee)
}

// Inversa: dado el monto que el creador quiere recibir, estima la meta bruta
// necesaria. Es una estimación (la inversa exacta de un redondeo compuesto no
// es perfecta), consistente con que ambos campos son solo una previsualización.
export function computeGrossAmount(netAmount, feeRates) {
  if (!Number.isFinite(netAmount) || !feeRates) return NaN
  const { platformRate, providerRate } = feeRates
  const combinedRate = platformRate + providerRate
  return round2(netAmount / (1 - combinedRate))
}
