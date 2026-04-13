import { useState, useRef, useEffect, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '$components/ui'
import api from '$utils/api/api'
import './CreateCampaign.css'
import { useUser } from '../../store/useUser'

import blobLeft from '$assets/textures/blob1.png'
import blobRight from '$assets/textures/blob2.png'

const CATEGORIES = [
  { name: 'Tecnología', id: 1 },
  { name: 'Educación', id: 2 },
  { name: 'Salud', id: 3 },
  { name: 'Medio Ambiente', id: 4 },
  { name: 'Arte y Cultura', id: 5 },
  { name: 'Comunidad', id: 6 },
]

const COUNTRIES = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia',
  'Ecuador', 'México', 'Paraguay', 'Perú', 'Uruguay', 'Venezuela',
  'España', 'Estados Unidos', 'Otro',
]

const STEPS = [
  { number: 1, label: 'Categoría',     sublabel: 'Tu área' },
  { number: 2, label: 'País',          sublabel: 'Ubicación' },
  { number: 3, label: 'Detalles',      sublabel: 'Info principal' },
  { number: 4, label: 'Media',         sublabel: 'Imágenes y video' },
  { number: 5, label: 'Revisión',      sublabel: 'Confirmar datos' },
]

const INITIAL_FORM = {
  title: '',
  shortDescription: '',
  category: '',
  country: '',
  duration: '30',
  goal: '',
  description: '',
  coverFile: null,
  coverPreview: '',
  videoUrl: '',
  imageFiles: [],
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

function StepCategoria({ form, onSelect }) {
  return (
    <>
      <h2 className="wizard-section-title">¿De qué trata tu proyecto?</h2>
      <p className="wizard-section-subtitle">
        La categoría ayuda a que tu campaña llegue a las personas indicadas. Podés cambiarla más adelante.
      </p>
      <div className="wizard-category-grid">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`wizard-category-card ${form.category === cat.name ? 'selected' : ''}`}
            onClick={() => onSelect(cat.name)}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </>
  )
}

function StepPais({ form, onChange }) {
  return (
    <>
      <div className="wizard-country-intro">
        <h2 className="wizard-section-title">¿Desde dónde vas a recaudar?</h2>
        <p className="wizard-country-body">
          Si vas a recaudar fondos como individuo, seleccioná tu país de residencia oficial.
          Si lo hacés en nombre de una empresa u organización, seleccioná el país donde esté
          registrada la identificación fiscal de la entidad.
        </p>
      </div>
      <div className="wizard-country-select-wrap">
        <select
          className="wizard-select"
          value={form.country}
          onChange={e => onChange('country', e.target.value)}
        >
          <option value="">Seleccioná tu país</option>
          {COUNTRIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
    </>
  )
}

function StepDetalles({ form, onChange }) {
  return (
    <>
      <h2 className="wizard-section-title">Detalles de la campaña</h2>
      <p className="wizard-section-subtitle">Contanos sobre tu proyecto. Esta información será visible para todos.</p>

      <div className="wizard-form-group">
        <label className="wizard-label">Título del proyecto</label>
        <input className="wizard-input" placeholder="Ej: Album debut de Los Horneros"
          maxLength={80} value={form.title} onChange={e => onChange('title', e.target.value)} />
        <span className="wizard-char-count">{form.title.length}/80</span>
      </div>

      <div className="wizard-form-group">
        <label className="wizard-label">Descripción corta <span>(se muestra en las cards)</span></label>
        <input className="wizard-input" placeholder="Una frase que resuma tu proyecto"
          maxLength={140} value={form.shortDescription} onChange={e => onChange('shortDescription', e.target.value)} />
        <span className="wizard-char-count">{form.shortDescription.length}/140</span>
      </div>

      <div className="wizard-form-row">
        <div className="wizard-form-group">
          <label className="wizard-label">Duración <span>(días)</span></label>
          <input className="wizard-input" type="number" min="1" max="90"
            value={form.duration} onChange={e => onChange('duration', e.target.value)} />
        </div>
        <div className="wizard-form-group">
          <label className="wizard-label">Objetivo a recaudar</label>
          <div className="wizard-input-prefix">
            <span className="wizard-prefix-symbol">$</span>
            <input type="number" placeholder="100000"
              value={form.goal} onChange={e => onChange('goal', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="wizard-form-group">
        <label className="wizard-label">Descripción completa</label>
        <textarea className="wizard-textarea" maxLength={2000}
          placeholder="Conta en detalle tu proyecto: qué es, por qué es importante, cómo vas a usar los fondos..."
          value={form.description} onChange={e => onChange('description', e.target.value)} />
        <span className="wizard-char-count">{form.description.length}/2000</span>
      </div>
    </>
  )
}

function StepMedia({ form, onChange }) {
  const fileRef  = useRef()
  const coverRef = useRef()

  const handleCover = (files) => {
    const file = files[0]
    if (!file) return
    onChange('coverFile', file)
    onChange('coverPreview', URL.createObjectURL(file))
  }

  const handleFiles = (files) => {
    const newFiles = Array.from(files)
    onChange('imageFiles', [...form.imageFiles, ...newFiles].slice(0, 6))
  }

  const removeImage = (i) => {
    onChange('imageFiles', form.imageFiles.filter((_, idx) => idx !== i))
  }

  return (
    <>
      <h2 className="wizard-section-title">Media de la campaña</h2>
      <p className="wizard-section-subtitle">Agregá imágenes y un video para mostrar tu proyecto.</p>

      <div className="wizard-form-group">
        <label className="wizard-label">Imagen de portada <span>(se muestra en las cards)</span></label>
        <div
          className="wizard-upload-zone"
          onClick={() => coverRef.current.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleCover(e.dataTransfer.files) }}
        >
          {form.coverPreview
            ? <img src={form.coverPreview} alt="Portada"
                style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
            : <p className="wizard-upload-text"><strong>Hacé clic o arrastrá</strong> la imagen de portada</p>
          }
        </div>
        <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => handleCover(e.target.files)} />
      </div>

      <div className="wizard-form-group">
        <label className="wizard-label">Imágenes <span>(máx. 6)</span></label>
        <div
          className="wizard-upload-zone"
          onClick={() => fileRef.current.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        >
          <p className="wizard-upload-text"><strong>Hacé clic o arrastrá</strong> para subir imágenes</p>
          <p className="wizard-upload-text" style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>PNG, JPG, WEBP · hasta 10MB c/u</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)} />
        {form.imageFiles.length > 0 && (
          <div className="wizard-image-previews">
            {form.imageFiles.map((file, i) => (
              <div className="wizard-preview-thumb" key={i}>
                <img src={URL.createObjectURL(file)} alt="" />
                <button className="wizard-preview-remove" onClick={() => removeImage(i)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="wizard-form-group">
        <label className="wizard-label">URL de video <span>(opcional · YouTube o Vimeo)</span></label>
        <input className="wizard-input" type="url" placeholder="https://youtube.com/watch?v=..."
          value={form.videoUrl} onChange={e => onChange('videoUrl', e.target.value)} />
      </div>
    </>
  )
}

function StepRevision({ form }) {
  return (
    <>
      <h2 className="wizard-section-title">Revisión final</h2>
      <p className="wizard-section-subtitle">Verificá que todo esté correcto antes de publicar.</p>

      <div className="wizard-review-section">
        <div className="wizard-review-section-title">Detalles</div>
        <div className="wizard-review-row"><span className="wizard-review-key">Categoría</span><span className="wizard-review-val">{form.category || '—'}</span></div>
        <div className="wizard-review-row"><span className="wizard-review-key">País</span><span className="wizard-review-val">{form.country || '—'}</span></div>
        <div className="wizard-review-row"><span className="wizard-review-key">Título</span><span className="wizard-review-val">{form.title || '—'}</span></div>
        <div className="wizard-review-row"><span className="wizard-review-key">Duración</span><span className="wizard-review-val">{form.duration} días</span></div>
        <div className="wizard-review-row"><span className="wizard-review-key">Objetivo</span><span className="wizard-review-val">{form.goal ? `$ ${Number(form.goal).toLocaleString('es-AR')}` : '—'}</span></div>
        {form.shortDescription && (
          <div className="wizard-review-row"><span className="wizard-review-key">Descripción corta</span><span className="wizard-review-val" style={{ maxWidth: '60%' }}>{form.shortDescription}</span></div>
        )}
      </div>

      {form.coverPreview && (
        <div className="wizard-review-section">
          <div className="wizard-review-section-title">Portada</div>
          <img src={form.coverPreview} alt="Portada"
            style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
        </div>
      )}

      {form.description && (
        <div className="wizard-review-section">
          <div className="wizard-review-section-title">Descripción completa</div>
          <p className="wizard-review-desc">{form.description}</p>
        </div>
      )}

      <div className="wizard-review-section">
        <div className="wizard-review-section-title">Media</div>
        <div className="wizard-review-row"><span className="wizard-review-key">Imágenes</span><span className="wizard-review-val">{form.imageFiles.length} cargadas</span></div>
        {form.videoUrl && (
          <div className="wizard-review-row"><span className="wizard-review-key">Video</span><span className="wizard-review-val" style={{ maxWidth: '60%', wordBreak: 'break-all' }}>{form.videoUrl}</span></div>
        )}
        {form.imageFiles.length > 0 && (
          <div className="wizard-image-previews" style={{ marginTop: '0.75rem' }}>
            {form.imageFiles.map((file, i) => (
              <div className="wizard-preview-thumb" key={i}><img src={URL.createObjectURL(file)} alt="" /></div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function CreateCampaign() {
  const navigate = useNavigate()
  const [step, setStep]         = useState(1)
  const [animating, setAnimating] = useState(false)
  const [form, setForm]         = useState(INITIAL_FORM)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const { user } = useUser()

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 2: return form.country ? '' : 'Seleccioná un país para continuar.'
      case 3: return form.title.trim() ? '' : 'El título es obligatorio.'
      case 4: return form.coverFile ? '' : 'Subí una imagen de portada.'
      default: return ''
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

  const handleCategorySelect = (cat) => {
    handleChange('category', cat)
    goToStep(2)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const media = []

      const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      if (form.coverFile) {
        media.push({
          base64Data: await toBase64(form.coverFile),
          mediaType: 'IMAGE',
          isPrimary: true,
          displayOrder: 0,
        })
      }

      for (let i = 0; i < form.imageFiles.length; i++) {
        media.push({
          base64Data: await toBase64(form.imageFiles[i]),
          mediaType: 'IMAGE',
          isPrimary: false,
          displayOrder: i + 1,
        })
      }

      if (form.videoUrl) {
        media.push({
          url: form.videoUrl,
          mediaType: 'VIDEO',
          isPrimary: false,
          displayOrder: media.length,
        })
      }

      const categoryObj = CATEGORIES.find(c => c.name === form.category)

      const startDate = new Date().toISOString().split('T')[0]
      const endDate = new Date(Date.now() + Number(form.duration) * 86400000).toISOString().split('T')[0]

      await api.post('/api/campaigns', {
        title: form.title,
        shortDescription: form.shortDescription,
        description: form.description,
        country: form.country,
        targetAmount: form.goal ? Number(form.goal) : null,
        startDate,
        endDate,
        owner: { id: user.userId },
        category: categoryObj ? { id: categoryObj.id } : null,
        media,
      })
      navigate('/campaigns')
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
            {step === 1 && <StepCategoria    form={form} onSelect={handleCategorySelect} />}
            {step === 2 && <StepPais          form={form} onChange={handleChange} />}
            {step === 3 && <StepDetalles      form={form} onChange={handleChange} />}
            {step === 4 && <StepMedia         form={form} onChange={handleChange} />}
            {step === 5 && <StepRevision      form={form} />}
          </div>

          {error && <p className="auth-error" style={{ marginTop: '1rem' }}>{error}</p>}

          <div className="wizard-footer">
            {step > 1
              ? <Button variant="secondary" onClick={() => goToStep(step - 1)}>← Atrás</Button>
              : <span />
            }
            {step < 5
              ? <Button variant="primary" onClick={() => goToStep(step + 1)}>Siguiente →</Button>
              : <Button variant="primary" size="lg" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Publicando...' : 'Publicar campaña'}
                </Button>
            }
          </div>
        </div>

      </div>
    </div>
  )
}

export default CreateCampaign