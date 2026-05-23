import { useState, useEffect, useRef } from 'react'
import { Eye, Pencil, HelpCircle, Check, AlertCircle, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import api from '$utils/api/api'

const MAX_LENGTH = 6000
const DEBOUNCE_MS = 1500

function SaveStatus({ status }) {
  if (status === 'saving') return (
    <span className="edc-historia-status edc-historia-status--saving">
      <Loader2 size={14} className="edc-spin" /> Guardando…
    </span>
  )
  if (status === 'saved') return (
    <span className="edc-historia-status edc-historia-status--saved">
      <Check size={14} /> Guardado
    </span>
  )
  if (status === 'error') return (
    <span className="edc-historia-status edc-historia-status--error">
      <AlertCircle size={14} /> Error al guardar
    </span>
  )
  return null
}

export default function SectionHistoria({ campaign, onSaved }) {
  const [description, setDescription] = useState(campaign.description || '')
  const [mode, setMode] = useState('edit')
  const [showGuide, setShowGuide] = useState(false)
  const [status, setStatus] = useState('idle')

  const lastSavedRef = useRef(campaign.description || '')
  const timerRef = useRef(null)

  useEffect(() => {
    if (description === lastSavedRef.current) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setStatus('saving')
      try {
        await api.put(`/api/campaigns/${campaign.id}`, {
          title: campaign.title,
          shortDescription: campaign.shortDescription,
          description,
          country: campaign.country,
          targetAmount: campaign.targetAmount,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          status: campaign.status,
          owner: campaign.owner ? { id: campaign.owner.id } : null,
          category: campaign.category ? { id: campaign.category.id } : null,
          // null => leave existing media untouched (this section never edits it)
          media: null,
        })
        lastSavedRef.current = description
        setStatus('saved')
        if (onSaved) onSaved()
      } catch (err) {
        setStatus('error')
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [description])

  const tooLong = description.length > MAX_LENGTH

  return (
    <div className="edc-form">
      <div className="edc-historia-intro">
        <p>
          Esta es <strong>la historia de tu proyecto</strong>: contá de qué se trata, por qué lo hacés,
          cómo funciona y cuáles son los riesgos. Es lo primero que verán los contribuidores cuando
          entren a tu campaña, así que tomate tu tiempo.
        </p>
        <p>
          Podés escribir directo o <strong>pegar texto en formato Markdown</strong>. Te lo vamos a
          renderizar tal cual al publicar. Los cambios se guardan automáticamente.
        </p>
        <button type="button" className="edc-historia-guide-toggle" onClick={() => setShowGuide(s => !s)}>
          <HelpCircle size={14} /> {showGuide ? 'Ocultar' : 'Ver'} guía rápida de Markdown
        </button>
        {showGuide && (
          <div className="edc-historia-guide">
            <div><code># Título</code> · <code>## Subtítulo</code> · <code>### Sub-sub</code></div>
            <div><code>**negrita**</code> · <code>*cursiva*</code> · <code>~~tachado~~</code></div>
            <div><code>- ítem de lista</code> · <code>1. ítem numerado</code> · <code>- [ ] tarea</code></div>
            <div><code>[texto del link](https://url.com)</code></div>
            <div><code>![alt](https://imagen.jpg)</code> para imágenes</div>
            <div><code>&gt; cita</code> · <code>`código`</code> · <code>---</code> separador</div>
            <div className="edc-historia-guide-note">
              No incluyas HTML ni scripts: se ignoran por seguridad.
            </div>
          </div>
        )}
      </div>

      <div className="edc-historia-tabs">
        <div className="edc-historia-tabs-left">
          <button
            type="button"
            className={`edc-historia-tab ${mode === 'edit' ? 'edc-historia-tab--active' : ''}`}
            onClick={() => setMode('edit')}
          >
            <Pencil size={14} /> Editar
          </button>
          <button
            type="button"
            className={`edc-historia-tab ${mode === 'preview' ? 'edc-historia-tab--active' : ''}`}
            onClick={() => setMode('preview')}
          >
            <Eye size={14} /> Vista previa
          </button>
        </div>
        <SaveStatus status={status} />
      </div>

      {mode === 'edit' ? (
        <div className="edc-field">
          <textarea
            className="edc-textarea edc-textarea--large"
            rows={20}
            maxLength={MAX_LENGTH}
            placeholder="# Mi proyecto&#10;&#10;Contá tu historia acá. Podés usar Markdown..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <span className="edc-hint">
            {description.length}/{MAX_LENGTH} caracteres
            {tooLong && ` — superaste el máximo permitido`}
          </span>
        </div>
      ) : (
        <div className="edc-historia-preview">
          {description.trim()
            ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
            : <p className="edc-historia-preview-empty">Todavía no escribiste nada. Pasá a "Editar" para empezar.</p>
          }
        </div>
      )}
    </div>
  )
}
