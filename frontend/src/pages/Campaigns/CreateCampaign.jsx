import { useState, useEffect, useRef, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X } from 'lucide-react'
import { Button } from '$components/ui'
import api from '$utils/api/api'
import { browserDiffersFromArgentina, argentinaMidnight, argentinaYmd, formatInBrowserTime } from '$utils/datetime'
import './CreateCampaign.css'
import { useUser } from '../../store/useUser'
import SouthAmericaMap from '$components/SouthAmericaMap/SouthAmericaMap'
import ImageCropModal from '$components/ImageCropModal/ImageCropModal'
import {
  TITLE_MAX, SHORT_DESC_MAX, DURATION_MIN, DURATION_MAX,
  GOAL_MIN, GOAL_MAX, MAX_IMAGE_BYTES, CROP_ASPECT,
  sanitizeDuration, formatAmountInput, parseAmount, formatMoney,
} from './campaignFormUtils'

import blobLeft from '$assets/textures/blob1.png'
import blobRight from '$assets/textures/blob2.png'

const STEPS = [
  { number: 1, label: 'Categoría', sublabel: 'Tu área' },
  { number: 2, label: 'País',      sublabel: 'Ubicación' },
  { number: 3, label: 'Detalles',  sublabel: 'Info principal' },
  { number: 4, label: 'Revisión',  sublabel: 'Confirmar datos' },
]

const INITIAL_FORM = {
  title: '',
  shortDescription: '',
  categoryId: '',
  categoryName: '',
  country: '',
  countryCode: '',
  duration: '30',
  goal: '',              // es-AR formatted string ("1.234,56")
  coverFile: null,
  coverPreview: '',
  coverError: '',
}

function StepCircle({ step, current }) {
  const done   = current > step.number
  const active = current === step.number
  return (
    <div className="wizard-step">
      <div className={`wizard-step-circle ${active ? 'active' : done ? 'done' : ''}`}>
        {done ? '✓' : step.number}
      </div>
    </div>
  )
}

function StepCategoria({ form, categories, loading, onSelect }) {
  return (
    <>
      <h2 className="wizard-section-title">¿De qué trata tu proyecto?</h2>
      <p className="wizard-section-subtitle">
        La categoría ayuda a que tu campaña llegue a las personas indicadas. Podés cambiarla más adelante.
      </p>
      {loading ? (
        <p className="wizard-section-subtitle">Cargando categorías…</p>
      ) : (
        <div className="wizard-category-grid">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`wizard-category-card ${form.categoryId === cat.id ? 'selected' : ''}`}
              onClick={() => onSelect(cat)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

function StepPais({ form, countries, onChange }) {
  const handleMapSelect = (country) => {
    if (country.code !== 'AR') return
    onChange('country', country.name)
    onChange('countryCode', country.code)
  }

  return (
    <>
      <div className="wizard-country-intro">
        <h2 className="wizard-section-title">¿Desde dónde vas a recaudar?</h2>
        <p className="wizard-country-body">
          Si vas a recaudar fondos como individuo, seleccioná tu país de residencia oficial.
          Si lo hacés en nombre de una empresa u organización, seleccioná el país donde esté
          registrada la identificación fiscal de la entidad.
        </p>
        <p className="wizard-country-body wizard-country-hint">
          Por el momento sólo aceptamos campañas desde <strong>Argentina</strong>.
        </p>
      </div>

      <SouthAmericaMap
        selectedCode={form.countryCode}
        enabledCodes={['AR']}
        onSelect={handleMapSelect}
      />

      <div className="wizard-country-select-wrap">
        <select
          className="wizard-select"
          value={form.countryCode}
          onChange={e => {
            const c = countries.find(x => x.code === e.target.value)
            onChange('countryCode', c?.code || '')
            onChange('country',     c?.name || '')
          }}
        >
          <option value="">Seleccioná tu país</option>
          {countries.map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>
    </>
  )
}

function formatDateAr(d) {
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function StepDetalles({ form, currency, onChange }) {
  const coverRef = useRef()
  const [cropSrc, setCropSrc] = useState(null)

  const durationNum = Math.min(DURATION_MAX, Math.max(DURATION_MIN, Number(form.duration) || DURATION_MIN))
  const endDate = new Date(Date.now() + durationNum * 86400000)

  // Si el creador está en otra zona horaria, le mostramos en su hora local cuándo abre y cierra
  // la campaña (las fechas se guardan como 00:00 de Argentina, GMT-3).
  const tzHint = browserDiffersFromArgentina()
    ? {
        start: formatInBrowserTime(argentinaMidnight(argentinaYmd(new Date()))),
        end: formatInBrowserTime(argentinaMidnight(argentinaYmd(endDate))),
      }
    : null

  const goalNum = parseAmount(form.goal)
  const goalError =
    form.goal !== '' && (Number.isNaN(goalNum) || goalNum < GOAL_MIN || goalNum > GOAL_MAX)
      ? `La meta debe estar entre ${formatMoney(GOAL_MIN, currency.symbol)} y ${formatMoney(GOAL_MAX, currency.symbol)}`
      : ''

  const pickCover = (files) => {
    const file = files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      onChange('coverError', 'La imagen supera los 10 MB.')
      return
    }
    onChange('coverError', '')
    setCropSrc(URL.createObjectURL(file))
  }

  return (
    <>
      <h2 className="wizard-section-title">Detalles de la campaña</h2>
      <p className="wizard-section-subtitle">Contanos sobre tu proyecto. Esta información será visible para todos.</p>

      <div className="wizard-form-group">
        <label className="wizard-label">Título del proyecto</label>
        <input className="wizard-input" placeholder="Ej: Album debut de Los Horneros"
          maxLength={TITLE_MAX} value={form.title} onChange={e => onChange('title', e.target.value)} />
        <span className="wizard-char-count">{form.title.length}/{TITLE_MAX}</span>
      </div>

      <div className="wizard-form-group">
        <label className="wizard-label">Descripción corta <span>(se muestra en las cards)</span></label>
        <textarea
          className="wizard-textarea wizard-textarea--short"
          rows={3}
          placeholder="Una frase que resuma tu proyecto"
          maxLength={SHORT_DESC_MAX}
          value={form.shortDescription}
          onChange={e => onChange('shortDescription', e.target.value)}
        />
        <span className="wizard-char-count">{form.shortDescription.length}/{SHORT_DESC_MAX}</span>
      </div>

      {/* Imagen principal — obligatoria, recortada a 16:9 */}
      <div className="wizard-form-group">
        <label className="wizard-label">Imagen principal <span>(obligatoria · se muestra en las cards)</span></label>
        <div
          className="wizard-upload-zone"
          onClick={() => coverRef.current.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); pickCover(e.dataTransfer.files) }}
        >
          {form.coverPreview ? (
            <div className="wizard-cover-preview">
              <img src={form.coverPreview} alt="Portada" />
              <button
                type="button"
                className="wizard-preview-remove"
                onClick={e => { e.stopPropagation(); onChange('coverFile', null); onChange('coverPreview', '') }}
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <>
              <Upload size={22} style={{ color: 'var(--color-text-muted)' }} />
              <p className="wizard-upload-text"><strong>Hacé clic o arrastrá</strong> la imagen principal</p>
              <p className="wizard-upload-text" style={{ fontSize: '0.8rem' }}>PNG, JPG, WEBP · hasta 10 MB · se recorta a 16:9</p>
            </>
          )}
        </div>
        <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { pickCover(e.target.files); e.target.value = '' }} />
        {form.coverError && <span className="wizard-helper wizard-helper--error">{form.coverError}</span>}
      </div>

      <div className="wizard-form-row">
        <div className="wizard-form-group">
          <label className="wizard-label">Duración <span>(días · {DURATION_MIN}–{DURATION_MAX})</span></label>
          <input
            className="wizard-input"
            type="number"
            min={DURATION_MIN}
            max={DURATION_MAX}
            step={1}
            value={form.duration}
            onChange={e => onChange('duration', sanitizeDuration(e.target.value))}
            onBlur={e => {
              const n = Number(e.target.value)
              onChange('duration', String(!n || n < DURATION_MIN ? DURATION_MIN : Math.min(DURATION_MAX, n)))
            }}
          />
          <span className="wizard-helper">
            Si publicás hoy, finaliza el <strong>{formatDateAr(endDate)}</strong>
          </span>
          {tzHint && (
            <span className="wizard-helper wizard-helper--tz">
              Las fechas usan el horario de Argentina (GMT-3). En tu zona horaria, la campaña
              comienza el <strong>{tzHint.start}</strong> y finaliza el <strong>{tzHint.end}</strong>.
            </span>
          )}
        </div>
        <div className="wizard-form-group">
          <label className="wizard-label">Meta <span>(monto objetivo a recaudar)</span></label>
          <div className="wizard-input-prefix">
            <span className="wizard-prefix-symbol">{currency.symbol}</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="100.000"
              value={form.goal}
              onChange={e => onChange('goal', formatAmountInput(e.target.value))}
            />
          </div>
          <span className="wizard-helper">
            En pesos argentinos por el momento · entre {formatMoney(GOAL_MIN, currency.symbol)} y {formatMoney(GOAL_MAX, currency.symbol)}
          </span>
          {goalError && <span className="wizard-helper wizard-helper--error">{goalError}</span>}
        </div>
      </div>

      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspect={CROP_ASPECT}
          fileName="portada.jpg"
          onCancel={() => { setCropSrc(null) }}
          onConfirm={({ file, previewUrl }) => {
            onChange('coverFile', file)
            onChange('coverPreview', previewUrl)
            setCropSrc(null)
          }}
        />
      )}
    </>
  )
}

function StepRevision({ form, currency }) {
  const durationNum = Math.min(DURATION_MAX, Math.max(DURATION_MIN, Number(form.duration) || DURATION_MIN))
  const endDate = new Date(Date.now() + durationNum * 86400000)
  const goalNum = parseAmount(form.goal)

  return (
    <>
      <h2 className="wizard-section-title">Revisión final</h2>
      <p className="wizard-section-subtitle">Verificá que todo esté correcto antes de guardar el borrador.</p>

      <div className="wizard-review-section">
        <div className="wizard-review-section-title">Detalles</div>
        <div className="wizard-review-row"><span className="wizard-review-key">Categoría</span><span className="wizard-review-val">{form.categoryName || '—'}</span></div>
        <div className="wizard-review-row"><span className="wizard-review-key">País</span><span className="wizard-review-val">{form.country || '—'}</span></div>
        <div className="wizard-review-row"><span className="wizard-review-key">Título</span><span className="wizard-review-val">{form.title || '—'}</span></div>
        <div className="wizard-review-row"><span className="wizard-review-key">Duración</span><span className="wizard-review-val">{durationNum} días</span></div>
        <div className="wizard-review-row"><span className="wizard-review-key">Finaliza</span><span className="wizard-review-val">{formatDateAr(endDate)}</span></div>
        <div className="wizard-review-row">
          <span className="wizard-review-key">Meta</span>
          <span className="wizard-review-val">
            {Number.isFinite(goalNum) && goalNum > 0 ? `${currency.symbol} ${form.goal}` : '—'}
          </span>
        </div>
      </div>

      {form.shortDescription && (
        <div className="wizard-review-section">
          <div className="wizard-review-section-title">Descripción corta</div>
          <p className="wizard-review-desc">{form.shortDescription}</p>
        </div>
      )}

      {form.coverPreview && (
        <div className="wizard-review-section">
          <div className="wizard-review-section-title">Imagen principal</div>
          <img src={form.coverPreview} alt="Portada"
            style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
        </div>
      )}

      <div className="wizard-review-section">
        <div className="wizard-review-section-title">Pasos siguientes</div>
        <p className="wizard-review-desc">
          Después de guardar el borrador vas a poder completar la <strong>historia</strong>,
          la <strong>galería y el video</strong> (sección "Media"), las recompensas y el
          resto del contenido desde la página de edición.
        </p>
      </div>
    </>
  )
}

function CreateCampaign() {
  const navigate = useNavigate()
  const [step, setStep]             = useState(1)
  const [animating, setAnimating]   = useState(false)
  const [form, setForm]             = useState(INITIAL_FORM)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)

  const [categories, setCategories] = useState([])
  const [countries, setCountries]   = useState([])
  const [currency, setCurrency]     = useState({ code: 'ARS', symbol: '$', minorUnit: 100 })
  const [refsLoading, setRefsLoading] = useState(true)

  const { user } = useUser()

  // Load reference data (categories, countries, currency) once
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
      setRefsLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setError(null)
  }

  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 1:
        return form.categoryId ? '' : 'Seleccioná una categoría para continuar.'
      case 2:
        return form.countryCode ? '' : 'Seleccioná un país para continuar.'
      case 3: {
        if (!form.title.trim()) return 'El título es obligatorio.'
        if (!form.shortDescription.trim()) return 'La descripción corta es obligatoria.'
        if (!form.coverFile) return 'Subí la imagen principal de la campaña.'
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
      default:
        return ''
    }
  }

  const goToStep = (newStep) => {
    if (newStep > step) {
      const err = validateStep(step)
      if (err) { setError(err); return }
    }
    setError(null)
    setAnimating(true)
    setTimeout(() => {
      setStep(newStep)
      setAnimating(false)
    }, 200)
  }

  // Selecting a category only updates the form — advancing happens via "Siguiente".
  const handleCategorySelect = (cat) => {
    setForm(prev => ({ ...prev, categoryId: cat.id, categoryName: cat.name }))
    setError(null)
  }

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleSubmit = async () => {
    for (let s = 1; s <= 3; s++) {
      const err = validateStep(s)
      if (err) { setError(err); setStep(s); return }
    }

    setLoading(true)
    setError(null)
    try {
      const startDate = new Date().toISOString().split('T')[0]
      const endDate = new Date(Date.now() + Number(form.duration) * 86400000).toISOString().split('T')[0]

      const media = [{
        base64Data: await toBase64(form.coverFile),
        mediaType: 'IMAGE',
        isPrimary: true,
        displayOrder: 0,
      }]

      const created = await api.post('/api/campaigns', {
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        description: '',
        country: form.country,
        targetAmount: parseAmount(form.goal),
        startDate,
        endDate,
        owner: { id: user.userId },
        category: { id: form.categoryId },
        media,
      })

      navigate(created?.id ? `/my-campaigns/${created.id}/edit` : '/my-campaigns')
    } catch (err) {
      console.error('Error al crear campaña:', err)
      setError('Hubo un error al crear la campaña. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-campaign-page">
      <img src={blobLeft}  className="deco-blob deco-blob-left"  alt="" />
      <img src={blobRight} className="deco-blob deco-blob-right" alt="" />
      <div className="create-campaign-inner">

        <nav className="wizard-stepper">
          {STEPS.map((s, i) => (
            <Fragment key={s.number}>
              <StepCircle step={s} current={step} />
              {i < STEPS.length - 1 && (
                <div className="wizard-connector">
                  <div className="wizard-connector-fill" style={{ width: step > i + 1 ? '100%' : '0%' }} />
                </div>
              )}
            </Fragment>
          ))}
        </nav>

        <div className="wizard-card">
          <div className={`wizard-step-content ${animating ? 'fading' : ''}`}>
            {step === 1 && <StepCategoria form={form} categories={categories} loading={refsLoading} onSelect={handleCategorySelect} />}
            {step === 2 && <StepPais      form={form} countries={countries} onChange={handleChange} />}
            {step === 3 && <StepDetalles  form={form} currency={currency} onChange={handleChange} />}
            {step === 4 && <StepRevision  form={form} currency={currency} />}
          </div>

          {error && <p className="auth-error" style={{ marginTop: '1rem' }}>{error}</p>}

          <div className="wizard-footer">
            {step > 1
              ? <Button variant="secondary" onClick={() => goToStep(step - 1)}>← Atrás</Button>
              : <span />
            }
            {step < STEPS.length
              ? <Button variant="primary" onClick={() => goToStep(step + 1)}>Siguiente →</Button>
              : <Button variant="primary" size="lg" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar borrador'}
                </Button>
            }
          </div>
        </div>

      </div>
    </div>
  )
}

export default CreateCampaign
