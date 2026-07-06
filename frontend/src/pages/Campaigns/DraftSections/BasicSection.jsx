import { useEffect, useMemo, useRef, useState } from 'react'
import { Save, Upload, X } from 'lucide-react'
import { Button, InfoTooltip } from '$components/ui'
import api from '$utils/api/api'
import ImageCropModal from '$components/ImageCropModal/ImageCropModal'
import { getMediaImageSrc } from '$utils/imageSources'
import { browserDiffersFromArgentina, argentinaYmd, formatArgentinaCloseDateTime } from '$utils/datetime'
import { useFeeRates } from '../../../hooks/useFeeRates'
import {
  TITLE_MAX, SHORT_DESC_MAX, DURATION_MIN, DURATION_MAX,
  GOAL_MIN, GOAL_MAX, MAX_IMAGE_BYTES, CROP_ASPECT,
  sanitizeDuration, formatAmountInput, parseAmount, amountToInput, formatMoney,
  computeNetAmount, computeGrossAmount,
} from '../campaignFormUtils'

function daysBetween(start, end) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(DURATION_MIN, Math.ceil(ms / 86400000))
}


function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function SectionBasicos({ campaign, onSaved, disableImmutableFields = false }) {
  // ── reference data (fetched once) ──────────────────────────────────────
  const [categories, setCategories] = useState([])
  const [countries, setCountries]   = useState([{ code: 'AR', name: 'Argentina' }])
  const [currency, setCurrency]     = useState({ code: 'ARS', symbol: '$', minorUnit: 100 })

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.get('/api/campaigns/categories').catch(() => []),
      api.get('/api/campaigns/countries').catch(() => [{ code: 'AR', name: 'Argentina' }]),
      api.get('/api/campaigns/currencies').catch(() => [{ code: 'ARS', symbol: '$', minorUnit: 100 }]),
    ]).then(([cats, ctrs, ccys]) => {
      if (cancelled) return
      setCategories(Array.isArray(cats) ? cats : [])
      setCountries(Array.isArray(ctrs) && ctrs.length ? ctrs : [{ code: 'AR', name: 'Argentina' }])
      if (Array.isArray(ccys) && ccys.length) setCurrency(ccys[0])
    })
    return () => { cancelled = true }
  }, [])

  // ── form state ────────────────────────────────────────────────────────
  const initialDuration = useMemo(() => {
    if (campaign.startDate && campaign.endDate) {
      return String(Math.min(DURATION_MAX, Math.max(DURATION_MIN, daysBetween(campaign.startDate, campaign.endDate))))
    }
    return '30'
  }, [campaign.startDate, campaign.endDate])

  const initialCountryName = campaign.country
    || (countries[0] && countries[0].name)
    || 'Argentina'

  const { feeRates } = useFeeRates()

  const [form, setForm] = useState({
    title: campaign.title || '',
    shortDescription: campaign.shortDescription || '',
    categoryId: campaign.category?.id || '',
    country: initialCountryName,
    duration: initialDuration,
    goal: amountToInput(campaign.targetAmount),
    netAmount: '',
  })

  // Una vez que llegan las tasas vigentes, calculamos el "monto a recibir"
  // inicial a partir de la meta ya cargada (si la campaña ya tenía una).
  useEffect(() => {
    if (!feeRates) return
    setForm(prev => {
      if (prev.netAmount !== '') return prev
      const g = parseAmount(prev.goal)
      return Number.isFinite(g) ? { ...prev, netAmount: amountToInput(computeNetAmount(g, feeRates)) } : prev
    })
  }, [feeRates])

  // Once categories load, make sure a valid one is selected (no empty option).
  useEffect(() => {
    if (!categories.length) return
    setForm(prev => {
      if (prev.categoryId && categories.some(c => c.id === Number(prev.categoryId))) return prev
      return { ...prev, categoryId: categories[0].id }
    })
  }, [categories])

  // Cover (primary image) — mandatory
  const existingCover = useMemo(
    () => (campaign.media || []).find(m => m.mediaType === 'IMAGE' && m.isPrimary)
       || (campaign.media || []).find(m => m.mediaType === 'IMAGE')
       || null,
    [campaign.media],
  )
  const [cover, setCover] = useState(existingCover)
  const [cropSrc, setCropSrc] = useState(null)
  const coverRef = useRef()

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const onChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setSaved(false)
    setError('')
  }

  const pickCover = (files) => {
    const file = files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setError('La imagen principal supera los 10 MB.')
      return
    }
    setError('')
    setCropSrc(URL.createObjectURL(file))
  }

  const durationNum = Math.min(DURATION_MAX, Math.max(DURATION_MIN, Number(form.duration) || DURATION_MIN))
  const previewEndDate = new Date(Date.now() + durationNum * 86400000)
  const immutableFieldsLocked = disableImmutableFields && campaign.status !== 'DRAFT'

  const goalNum = parseAmount(form.goal)
  const goalError =
    form.goal !== '' && (Number.isNaN(goalNum) || goalNum < GOAL_MIN || goalNum > GOAL_MAX)
      ? `La meta debe estar entre ${formatMoney(GOAL_MIN, currency.symbol)} y ${formatMoney(GOAL_MAX, currency.symbol)}`
      : ''

  // Meta y "monto a recibir" son dos vistas del mismo valor: al editar una se
  // recalcula la otra usando las tasas de comisión vigentes.
  const handleGoalChange = (raw) => {
    const formatted = formatAmountInput(raw)
    const g = parseAmount(formatted)
    setForm(prev => ({
      ...prev,
      goal: formatted,
      netAmount: feeRates && Number.isFinite(g) ? amountToInput(computeNetAmount(g, feeRates)) : '',
    }))
    setSaved(false)
    setError('')
  }

  const handleNetChange = (raw) => {
    const formatted = formatAmountInput(raw)
    const n = parseAmount(formatted)
    setForm(prev => ({
      ...prev,
      netAmount: formatted,
      goal: feeRates && Number.isFinite(n) ? amountToInput(computeGrossAmount(n, feeRates)) : '',
    }))
    setSaved(false)
    setError('')
  }

  const validate = () => {
    if (!form.title.trim()) return 'El título es obligatorio.'
    if (!form.shortDescription.trim()) return 'La descripción corta es obligatoria.'
    if (!form.categoryId) return 'Seleccioná una categoría.'
    if (!form.country) return 'Seleccioná un país.'
    if (!cover) return 'La imagen principal es obligatoria.'
    const d = Number(form.duration)
    if (!Number.isFinite(d) || d < DURATION_MIN || d > DURATION_MAX) {
      return `La duración debe estar entre ${DURATION_MIN} y ${DURATION_MAX} días.`
    }
    const g = parseAmount(form.goal)
    if (!Number.isFinite(g) || g < GOAL_MIN || g > GOAL_MAX) {
      return `La meta debe estar entre ${formatMoney(GOAL_MIN, currency.symbol)} y ${formatMoney(GOAL_MAX, currency.symbol)}.`
    }
    return ''
  }

  const handleSave = async () => {
    const v = validate()
    if (v) { setError(v); return }

    setSaving(true)
    setError('')
    try {
      // Preserve gallery + video (non-primary media is managed by the Midia section)
      const rest = (campaign.media || []).filter(m => !(m.mediaType === 'IMAGE' && m.isPrimary))

      const coverEntry = cover._file
        ? { base64Data: await fileToBase64(cover._file), mediaType: 'IMAGE', isPrimary: true, displayOrder: 0 }
        : {
            base64Data: cover.base64Data || null,
            url: cover.url || null,
            mediaType: 'IMAGE',
            isPrimary: true,
            displayOrder: 0,
          }

      const media = [coverEntry, ...rest]

      const startISO = campaign.startDate || argentinaYmd(new Date())
      const endISO = immutableFieldsLocked
        ? campaign.endDate
        : argentinaYmd(new Date(Date.now() + durationNum * 86400000))

      await api.put(`/api/campaigns/${campaign.id}`, {
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        description: campaign.description || '',
        country: form.country,
        targetAmount: immutableFieldsLocked ? campaign.targetAmount : parseAmount(form.goal),
        startDate: startISO,
        endDate: endISO,
        status: campaign.status,
        owner: { id: campaign.owner?.id },
        category: { id: Number(form.categoryId) },
        media,
      })

      setSaved(true)
      if (onSaved) onSaved()
    } catch (err) {
      setError('Error al guardar: ' + (err.message || 'Intentá de nuevo'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="edc-form">
      <div className="edc-field">
        <label className="edc-label">Título del proyecto</label>
        <input className="edc-input" type="text" maxLength={TITLE_MAX}
          placeholder="Ej: Album debut de Los Horneros"
          value={form.title} onChange={e => onChange('title', e.target.value)} />
        <span className="edc-hint">{form.title.length}/{TITLE_MAX} caracteres</span>
      </div>

      <div className="edc-field">
        <label className="edc-label">Descripción corta <span className="edc-optional">se muestra en las cards</span></label>
        <textarea
          className="edc-textarea"
          rows={3}
          maxLength={SHORT_DESC_MAX}
          placeholder="Una frase que resuma tu proyecto"
          value={form.shortDescription}
          onChange={e => onChange('shortDescription', e.target.value)}
        />
        <span className="edc-hint">{form.shortDescription.length}/{SHORT_DESC_MAX} caracteres</span>
      </div>

      {/* Imagen principal — obligatoria, recortada a 16:9 */}
      <div className="edc-field">
        <label className="edc-label">Imagen principal <span className="edc-optional">obligatoria · se recorta a 16:9</span></label>
        <div className="edc-upload" onClick={() => coverRef.current.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); pickCover(e.dataTransfer.files) }}>
          {cover ? (
            <div className="edc-upload-preview">
              <img src={getMediaImageSrc(cover)} alt="Portada" />
              <button className="edc-upload-remove" onClick={e => { e.stopPropagation(); setCover(null); setSaved(false) }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="edc-upload-empty">
              <Upload size={24} />
              <span>Hacé clic o arrastrá la imagen principal · PNG/JPG/WEBP · hasta 10 MB</span>
            </div>
          )}
        </div>
        <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { pickCover(e.target.files); e.target.value = '' }} />
      </div>

      <div className="edc-row">
        <div className="edc-field">
          <label className="edc-label">Categoría</label>
          <select className="edc-select" value={form.categoryId} onChange={e => onChange('categoryId', e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <span className="edc-hint edc-hint--left">
            La categoría ayuda a que tu campaña llegue a las personas indicadas.
          </span>
        </div>
        <div className="edc-field">
          <label className="edc-label">País</label>
          <select className="edc-select" value={form.country} onChange={e => onChange('country', e.target.value)}>
            {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
          </select>
          {countries.length === 1 && (
            <span className="edc-hint edc-hint--left">Por ahora sólo aceptamos campañas desde {countries[0].name}.</span>
          )}
        </div>
      </div>

      <div className="edc-row">
        <div className="edc-field">
          <label className="edc-label">Duración <span className="edc-optional">(días · {DURATION_MIN}–{DURATION_MAX})</span></label>
          <input
            className="edc-input"
            type="number"
            min={DURATION_MIN}
            max={DURATION_MAX}
            step={1}
            value={form.duration}
            disabled={immutableFieldsLocked}
            onChange={e => onChange('duration', sanitizeDuration(e.target.value))}
            onBlur={e => {
              const n = Number(e.target.value)
              onChange('duration', String(!n || n < DURATION_MIN ? DURATION_MIN : Math.min(DURATION_MAX, n)))
            }}
          />
          <span className="edc-hint edc-hint--left">
            {immutableFieldsLocked
              ? <>La duración queda fija después de publicar la campaña. Finaliza el <strong>{formatArgentinaCloseDateTime(campaign.endDate)}</strong></>
              : <>Si publicás hoy, finaliza el <strong>{formatArgentinaCloseDateTime(previewEndDate)}</strong></>}
          </span>
          {browserDiffersFromArgentina() && (
            <span className="edc-hint edc-hint--tz">
              Las fechas se cuentan en el horario de Argentina (GMT-3).
            </span>
          )}
        </div>
        <div className="edc-field">
          <label className="edc-label">Meta <span className="edc-optional">(monto objetivo a recaudar)</span></label>
          <div className={`edc-input-prefix ${immutableFieldsLocked ? 'edc-input-prefix--disabled' : ''}`}>
            <span className="edc-prefix-symbol">{currency.symbol}</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="100.000"
              value={form.goal}
              disabled={immutableFieldsLocked}
              onChange={e => handleGoalChange(e.target.value)}
            />
          </div>
          <span className="edc-hint edc-hint--left">
            {immutableFieldsLocked
              ? 'La meta no se puede modificar una vez publicada la campaña.'
              : `En pesos argentinos por el momento · entre ${formatMoney(GOAL_MIN, currency.symbol)} y ${formatMoney(GOAL_MAX, currency.symbol)}`}
          </span>
          {goalError && <span className="edc-hint edc-hint--left" style={{ color: '#c44' }}>{goalError}</span>}
        </div>
      </div>

      <div className="edc-field">
        <label className="edc-label">
          Vas a recibir <span className="edc-optional">(estimado)</span>
          <InfoTooltip label="Cómo se calcula el monto a recibir">
            {feeRates
              ? <>De cada aporte se descuenta un {(feeRates.platformRate * 100).toLocaleString('es-AR')}%
                  de comisión de la plataforma y un {(feeRates.providerRate * 100).toLocaleString('es-AR')}%
                  de comisión de Mercado Pago. Este monto es una estimación asumiendo que la campaña
                  recauda exactamente la meta y no la supera.</>
              : 'Calculando comisiones vigentes...'}
          </InfoTooltip>
        </label>
        <div className={`edc-input-prefix ${immutableFieldsLocked ? 'edc-input-prefix--disabled' : ''}`}>
          <span className="edc-prefix-symbol">{currency.symbol}</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="90.000"
            value={form.netAmount}
            disabled={immutableFieldsLocked || !feeRates}
            onChange={e => handleNetChange(e.target.value)}
          />
        </div>
        <span className="edc-hint edc-hint--left">
          {immutableFieldsLocked
            ? 'No se puede modificar una vez publicada la campaña.'
            : 'Ya con las comisiones de la plataforma y de Mercado Pago descontadas'}
        </span>
      </div>

      {error && (
        <p className="auth-error" style={{ margin: 0 }}>{error}</p>
      )}

      <div className="edc-save-row">
        <Button variant="primary" size="md" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
        {saved && <span className="edc-saved-msg">Guardado correctamente</span>}
      </div>

      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspect={CROP_ASPECT}
          fileName="portada.jpg"
          onCancel={() => setCropSrc(null)}
          onConfirm={({ file, previewUrl }) => {
            setCover({ _file: file, previewUrl, isPrimary: true, mediaType: 'IMAGE' })
            setSaved(false)
            setCropSrc(null)
          }}
        />
      )}
    </div>
  )
}
