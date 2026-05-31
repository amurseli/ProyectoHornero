import { useMemo, useState } from 'react'
import { Eye, Pencil, HelpCircle, Save, Plus, Trash2 } from 'lucide-react'
import { Button } from '$components/ui'
import MarkdownContent from '$components/markdown/MarkdownContent'
import api from '$utils/api/api'
import {
  CAMPAIGN_UPDATE_MAX_LENGTH,
  CAMPAIGN_UPDATE_PUBLIC_PREVIEW_LENGTH,
  formatCampaignUpdateDate,
  getCampaignUpdateMarkdownPreview,
} from './campaignUpdateUtils'
import './CampaignUpdates.css'

const EMPTY_FORM = { title: '', content: '' }

function sortUpdatesDesc(items) {
  return [...(Array.isArray(items) ? items : [])].sort(
    (a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0)
  )
}

function CreatorUpdateCard({ update, number, onEdit, onDelete }) {
  const preview = useMemo(
    () => getCampaignUpdateMarkdownPreview(update.content, CAMPAIGN_UPDATE_PUBLIC_PREVIEW_LENGTH),
    [update.content]
  )

  return (
    <article className="cu-manage-card">
      <div className="cu-manage-card-body">
        <div className="cu-manage-card-head">
          <div>
            <span className="cu-manage-card-kicker">Actualización #{number}</span>
            <h3 className="cu-manage-card-title">{update.title}</h3>
            <p className="cu-manage-card-date">
              Publicada el {formatCampaignUpdateDate(update.createdAt)}
              {update.updatedAt && update.updatedAt !== update.createdAt ? ` · editada ${formatCampaignUpdateDate(update.updatedAt)}` : ''}
            </p>
          </div>
          <div className="cu-manage-card-actions">
            <button type="button" className="cu-manage-card-icon-btn" onClick={() => onEdit(update)} title="Editar actualización">
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className="cu-manage-card-icon-btn cu-manage-card-icon-btn--danger"
              onClick={() => onDelete(update)}
              title="Eliminar actualización"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <MarkdownContent content={preview.text} className="cu-manage-card-excerpt" />
      </div>
    </article>
  )
}

export default function CampaignUpdatesManager({ campaignId, updates, onUpdatesChange }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [mode, setMode] = useState('edit')
  const [showGuide, setShowGuide] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)

  const orderedUpdates = useMemo(() => sortUpdatesDesc(updates), [updates])

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setSaved(false)
    setError('')
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setMode('edit')
    setSaved(false)
    setError('')
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        title: form.title,
        content: form.content,
      }
      const response = editingId
        ? await api.put(`/api/campaigns/${campaignId}/updates/${editingId}`, payload)
        : await api.post(`/api/campaigns/${campaignId}/updates`, payload)

      const nextUpdates = editingId
        ? orderedUpdates.map((item) => (item.id === editingId ? response : item))
        : [response, ...orderedUpdates]

      onUpdatesChange(sortUpdatesDesc(nextUpdates))
      resetForm()
      setSaved(true)
    } catch (err) {
      setError(err.message || 'No se pudo guardar la actualización')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (update) => {
    setEditingId(update.id)
    setForm({
      title: update.title || '',
      content: update.content || '',
    })
    setMode('edit')
    setSaved(false)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (update) => {
    const confirmed = window.confirm(`Vas a eliminar la actualización "${update.title}".`)
    if (!confirmed) return

    try {
      await api.delete(`/api/campaigns/${campaignId}/updates/${update.id}`)
      onUpdatesChange(orderedUpdates.filter((item) => item.id !== update.id))
      if (editingId === update.id) resetForm()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la actualización')
    }
  }

  return (
    <section className="ccd-section">
      <div className="ccd-panel-header">
        <div>
          <h2 className="ccd-block-title">Actualizaciones</h2>
          <p className="ccd-block-subtitle">Publicá avances del proyecto para mantener informada a la comunidad.</p>
        </div>
      </div>

      <div className="cu-manage-shell">
        <div className="ccd-table-card">
          <div className="edc-form">
            <div className="edc-historia-intro">
              <p>
                Cada actualización queda publicada en la pestaña pública de la campaña. Usá un título claro
                y contá en <strong>Markdown</strong> qué se avanzó, qué cambió o qué viene después.
              </p>
              <button type="button" className="edc-historia-guide-toggle" onClick={() => setShowGuide((current) => !current)}>
                <HelpCircle size={14} /> {showGuide ? 'Ocultar' : 'Ver'} guía rápida de Markdown
              </button>
              {showGuide && (
                <div className="edc-historia-guide">
                  <div><code># Título</code> · <code>## Subtítulo</code> · <code>### Sub-sub</code></div>
                  <div><code>**negrita**</code> · <code>*cursiva*</code> · <code>~~tachado~~</code></div>
                  <div><code>- ítem</code> · <code>1. ítem numerado</code> · <code>&gt; cita</code></div>
                  <div><code>[texto del link](https://url.com)</code> · <code>`código`</code></div>
                </div>
              )}
            </div>

            <div className="edc-field">
              <label className="edc-label" htmlFor="campaign-update-title">Título</label>
              <input
                id="campaign-update-title"
                className="edc-input"
                maxLength={180}
                placeholder="Ej: Terminamos el prototipo funcional"
                value={form.title}
                onChange={(event) => handleChange('title', event.target.value)}
              />
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
                <label className="edc-label" htmlFor="campaign-update-content">Texto</label>
                <textarea
                  id="campaign-update-content"
                  className="edc-textarea edc-textarea--large"
                  rows={14}
                  maxLength={CAMPAIGN_UPDATE_MAX_LENGTH}
                  placeholder="Contá qué estuvieron trabajando, qué lograron y qué sigue."
                  value={form.content}
                  onChange={(event) => handleChange('content', event.target.value)}
                />
                <span className="edc-hint">{form.content.length}/{CAMPAIGN_UPDATE_MAX_LENGTH} caracteres</span>
              </div>
            ) : (
              <MarkdownContent
                content={form.content}
                framed
                fullHeight
                className="edc-historia-preview"
                emptyText="Todavía no escribiste la actualización."
              />
            )}

            {error && <p className="auth-error" style={{ margin: 0 }}>{error}</p>}

            <div className="edc-save-row">
              <Button variant="primary" size="md" onClick={handleSubmit} disabled={saving}>
                {editingId ? <Save size={16} /> : <Plus size={16} />}
                {saving ? 'Guardando...' : editingId ? 'Guardar actualización' : 'Publicar actualización'}
              </Button>
              {editingId && (
                <Button variant="secondary" size="md" onClick={resetForm} disabled={saving}>
                  Cancelar edición
                </Button>
              )}
              {saved && <span className="edc-saved-msg">Actualización guardada correctamente</span>}
            </div>
          </div>
        </div>

        <div className="ccd-table-card">
          <div className="ccd-table-header">
            <div>
              <h3 className="ccd-block-title cu-manage-list-title">Publicadas</h3>
              <p className="ccd-block-subtitle">Se muestran primero las más recientes.</p>
            </div>
          </div>

          {orderedUpdates.length ? (
            <div className="cu-manage-list">
              {orderedUpdates.map((update, index) => (
                <CreatorUpdateCard
                  key={update.id}
                  update={update}
                  number={orderedUpdates.length - index}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <p className="ccd-empty">Todavía no publicaste actualizaciones para esta campaña.</p>
          )}
        </div>
      </div>
    </section>
  )
}
