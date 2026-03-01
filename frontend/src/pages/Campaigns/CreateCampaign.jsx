import { useState, useRef, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '$components/ui'
import api from '$utils/api/api'
import './CreateCampaign.css'
import { useUser } from '../../store/useUser'


const CATEGORIES = ['Arte', 'Tecnología', 'Música', 'Cine', 'Diseño', 'Comunidad', 'Deportes', 'Educación']


const STEPS = [
  { number: 1, label: 'Detalles',  sublabel: 'Info principal' },
  { number: 2, label: 'Media',     sublabel: 'Imágenes y video' },
  { number: 3, label: 'Revisión',  sublabel: 'Confirmar datos' },
]

const INITIAL_FORM = {
  title: '',
  shortDescription: '',
  category: '',
  duration: '30',
  goal: '',
  description: '',
  coverFile: null,
  coverPreview: '',
  videoUrl: '',
  images: [],
}

function StepCircle({ step, current }) {
  const done   = current > step.number
  const active = current === step.number
  return (
    <div className="wizard-step">
      <div className={`wizard-step-circle ${active ? 'active' : done ? 'done' : ''}`}>
        {done ? '✓' : step.number}
      </div>
      <div className="wizard-step-label">
        <span className={`wizard-step-name ${active ? 'active' : ''}`}>{step.label}</span>
        <span className="wizard-step-sub">{step.sublabel}</span>
      </div>
    </div>
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
          <label className="wizard-label">Categoría</label>
          <select className="wizard-select" value={form.category} onChange={e => onChange('category', e.target.value)}>
            <option value="">Seleccionar...</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="wizard-form-group">
          <label className="wizard-label">Duración <span>(días)</span></label>
          <input className="wizard-input" type="number" min="1" max="90"
            value={form.duration} onChange={e => onChange('duration', e.target.value)} />
        </div>
      </div>

      <div className="wizard-form-group">
        <label className="wizard-label">Objetivo a recaudar</label>
        <div className="wizard-input-prefix">
          <span className="wizard-prefix-symbol">$</span>
          <input type="number" placeholder="100000"
            value={form.goal} onChange={e => onChange('goal', e.target.value)} />
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
    const urls = Array.from(files).map(f => URL.createObjectURL(f))
    onChange('images', [...form.images, ...urls].slice(0, 6))
  }

  const removeImage = (i) => onChange('images', form.images.filter((_, idx) => idx !== i))

  return (
    <>
      <h2 className="wizard-section-title">Media de la campaña</h2>
      <p className="wizard-section-subtitle">Agregá imágenes y un video para mostrar tu proyecto.</p>

      {/* Portada */}
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
            : <>
                <p className="wizard-upload-text"><strong>Hacé clic o arrastrá</strong> la imagen de portada</p>
              </>
          }
        </div>
        <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => handleCover(e.target.files)} />
      </div>

      {/* Galería */}
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
        {form.images.length > 0 && (
          <div className="wizard-image-previews">
            {form.images.map((url, i) => (
              <div className="wizard-preview-thumb" key={i}>
                <img src={url} alt="" />
                <button className="wizard-preview-remove" onClick={() => removeImage(i)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video */}
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
        <div className="wizard-review-row"><span className="wizard-review-key">Título</span><span className="wizard-review-val">{form.title || '—'}</span></div>
        <div className="wizard-review-row"><span className="wizard-review-key">Categoría</span><span className="wizard-review-val">{form.category || '—'}</span></div>
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
        <div className="wizard-review-row"><span className="wizard-review-key">Imágenes</span><span className="wizard-review-val">{form.images.length} cargadas</span></div>
        {form.videoUrl && (
          <div className="wizard-review-row"><span className="wizard-review-key">Video</span><span className="wizard-review-val" style={{ maxWidth: '60%', wordBreak: 'break-all' }}>{form.videoUrl}</span></div>
        )}
        {form.images.length > 0 && (
          <div className="wizard-image-previews" style={{ marginTop: '0.75rem' }}>
            {form.images.map((url, i) => (
              <div className="wizard-preview-thumb" key={i}><img src={url} alt="" /></div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function CreateCampaign() {
  const navigate = useNavigate()
  const [step, setStep]     = useState(1)
  const [form, setForm]     = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  const { user } = useUser()

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const media = []

      if (form.coverFile) {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result.split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(form.coverFile)
        })
        media.push({
          base64Data,
          mediaType: 'IMAGE',
          isPrimary: true,
          displayOrder: 0,
        })
      }

      await api.post('/api/campaigns', {
        title: form.title,
        shortDescription: form.shortDescription,
        description: form.description,
        targetAmount: form.goal ? Number(form.goal) : null,
        owner: { id: user.userId },
        media,
      })
      navigate('/my-campaigns')
    } catch (err) {
      console.error('Error al crear campaña:', err)
      setError('Hubo un error al crear la campaña. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-campaign-page">
      <div className="create-campaign-inner">

        <header className="create-campaign-header">
          <h1 className="create-campaign-title">Crear nueva campaña</h1>
          <p className="create-campaign-subtitle">Completá los pasos para publicar tu proyecto en Hornero</p>
        </header>

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
          {step === 1 && <StepDetalles form={form} onChange={handleChange} />}
          {step === 2 && <StepMedia    form={form} onChange={handleChange} />}
          {step === 3 && <StepRevision form={form} />}

          {error && <p className="auth-error" style={{ marginTop: '1rem' }}>{error}</p>}

          <div className="wizard-footer">
            {step > 1
              ? <Button variant="secondary" onClick={() => setStep(s => s - 1)}>← Atrás</Button>
              : <span />
            }
            {step < 3
              ? <Button variant="primary" onClick={() => setStep(s => s + 1)}>Siguiente →</Button>
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