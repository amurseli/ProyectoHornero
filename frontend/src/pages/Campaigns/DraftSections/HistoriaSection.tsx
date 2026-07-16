import { useState } from 'react'
import { Eye, Pencil, HelpCircle, Save } from 'lucide-react'
import { Button } from '$components/ui'
import MarkdownContent from '$components/markdown/MarkdownContent'
import api from '$utils/api/api'

const MAX_LENGTH = 6000

export default function SectionHistoria({ campaign, onSaved }) {
  const [description, setDescription] = useState(campaign.description || '')
  const [mode, setMode] = useState('edit')
  const [showGuide, setShowGuide] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const tooLong = description.length > MAX_LENGTH

  const handleChange = (value) => {
    setDescription(value)
    setSaved(false)
    setError('')
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
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
      <div className="edc-historia-intro">
        <p>
          Esta es <strong>la historia de tu proyecto</strong>: contá de qué se trata, por qué lo hacés,
          cómo funciona y cuáles son los riesgos. Es lo primero que verán los contribuidores cuando
          entren a tu campaña, así que tomate tu tiempo.
        </p>
        <p>
          Podés escribir directo o <strong>pegar texto en formato Markdown</strong>. Te lo vamos a
          renderizar tal cual al publicar.
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
      </div>

      {mode === 'edit' ? (
        <div className="edc-field">
          <textarea
            className="edc-textarea edc-textarea--large"
            rows={20}
            maxLength={MAX_LENGTH}
            placeholder="# Mi proyecto&#10;&#10;Contá tu historia acá. Podés usar Markdown..."
            value={description}
            onChange={e => handleChange(e.target.value)}
          />
          <span className="edc-hint">
            {description.length}/{MAX_LENGTH} caracteres
            {tooLong && ` — superaste el máximo permitido`}
          </span>
        </div>
      ) : (
        <MarkdownContent
          content={description}
          className="edc-historia-preview"
          emptyText='Todavía no escribiste nada. Pasá a "Editar" para empezar.'
        />
      )}

      {error && <p className="auth-error" style={{ margin: 0 }}>{error}</p>}

      <div className="edc-save-row">
        <Button variant="primary" size="md" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
        {saved && <span className="edc-saved-msg">Guardado correctamente</span>}
      </div>
    </div>
  )
}
