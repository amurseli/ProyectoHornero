import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Save, X, HelpCircle, AlertCircle } from 'lucide-react'
import Swal from 'sweetalert2'
import { Button } from '$components/ui'
import api from '$utils/api/api'

const QUESTION_MAX = 100
const ANSWER_MAX = 600

function validate(form) {
  const errors = {}
  if (!form.question || !form.question.trim()) errors.question = 'La pregunta es obligatoria'
  else if (form.question.length > QUESTION_MAX) errors.question = `Máximo ${QUESTION_MAX} caracteres`
  if (!form.answer || !form.answer.trim()) errors.answer = 'La respuesta es obligatoria'
  else if (form.answer.length > ANSWER_MAX) errors.answer = `Máximo ${ANSWER_MAX} caracteres`
  return errors
}

function FaqEditForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    question: initial?.question || '',
    answer: initial?.answer || '',
  })
  const [errors, setErrors] = useState({})

  const onChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  // Valida un solo campo al perder el foco, reutilizando validate().
  const handleFieldBlur = (key) => {
    setErrors(prev => ({ ...prev, [key]: validate(form)[key] }))
  }

  const handleSubmit = () => {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSave({
      question: form.question.trim(),
      answer: form.answer.trim(),
    })
  }

  return (
    <div className="rws-edit">
      <div className="edc-field">
        <label className="edc-label">Pregunta *</label>
        <input
          className={`edc-input ${errors.question ? 'edc-input--error' : ''}`}
          type="text"
          maxLength={QUESTION_MAX}
          placeholder="Ej: ¿Cuándo se entregan las recompensas?"
          value={form.question}
          onChange={e => onChange('question', e.target.value)}
          onBlur={() => handleFieldBlur('question')}
        />
        {errors.question && <span className="edc-error"><AlertCircle size={12} /> {errors.question}</span>}
        <span className="edc-hint">{form.question.length}/{QUESTION_MAX} caracteres</span>
      </div>

      <div className="edc-field">
        <label className="edc-label">Respuesta *</label>
        <textarea
          className={`edc-textarea ${errors.answer ? 'edc-input--error' : ''}`}
          rows={5}
          maxLength={ANSWER_MAX}
          placeholder="Respondé la duda con la mayor claridad posible."
          value={form.answer}
          onChange={e => onChange('answer', e.target.value)}
          onBlur={() => handleFieldBlur('answer')}
        />
        {errors.answer && <span className="edc-error"><AlertCircle size={12} /> {errors.answer}</span>}
        <span className="edc-hint">{form.answer.length}/{ANSWER_MAX} caracteres</span>
      </div>

      <div className="rws-edit-actions">
        <Button onClick={handleSubmit} disabled={saving}>
          <Save size={16} /> {saving ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          <X size={16} /> Cancelar
        </Button>
      </div>
    </div>
  )
}

function FaqCard({ faq, index, total, onEdit, onDelete, onMoveUp, onMoveDown, disabled }) {
  return (
    <div className="rws-card">
      <div className="rws-card-image rws-card-image--faq-index">
        <div className="fqs-card-index">{String(index + 1).padStart(2, '0')}</div>
      </div>
      <div className="rws-card-body">
        <h4 className="rws-card-title">{faq.question}</h4>
        <p className="rws-card-desc">{faq.answer}</p>
      </div>
      <div className="rws-card-actions">
        <button className="rws-icon-btn" onClick={onMoveUp} disabled={disabled || index === 0} title="Subir">
          <ChevronUp size={16} />
        </button>
        <button className="rws-icon-btn" onClick={onMoveDown} disabled={disabled || index === total - 1} title="Bajar">
          <ChevronDown size={16} />
        </button>
        <button className="rws-icon-btn" onClick={onEdit} disabled={disabled} title="Editar">
          <Pencil size={16} />
        </button>
        <button className="rws-icon-btn rws-icon-btn--danger" onClick={onDelete} disabled={disabled} title="Eliminar">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default function SectionFaq({ campaign, onSaved }) {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)

  const baseUrl = `/api/campaigns/${campaign.id}/faqs`

  const fetchFaqs = async () => {
    try {
      const data = await api.get(baseUrl)
      setFaqs([...(data || [])].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)))
    } catch {
      Swal.fire('Error', 'No se pudieron cargar las preguntas frecuentes.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFaqs() }, [campaign.id])

  const notifyParent = () => { if (onSaved) onSaved() }

  const handleCreate = async (data) => {
    setBusy(true)
    try {
      await api.post(baseUrl, { ...data, displayOrder: faqs.length })
      setCreating(false)
      await fetchFaqs()
      notifyParent()
    } catch {
      Swal.fire('Error', 'No se pudo crear la pregunta frecuente. Intentá de nuevo.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleUpdate = async (id, data) => {
    setBusy(true)
    try {
      const current = faqs.find(f => f.id === id)
      await api.put(`${baseUrl}/${id}`, { ...data, displayOrder: current?.displayOrder ?? 0 })
      setEditingId(null)
      await fetchFaqs()
      notifyParent()
    } catch {
      Swal.fire('Error', 'No se pudo guardar la pregunta frecuente. Intentá de nuevo.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (faq) => {
    const result = await Swal.fire({
      title: '¿Eliminar pregunta frecuente?',
      html: `Estás por eliminar <strong>${faq.question}</strong>.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    })
    if (!result.isConfirmed) return

    setBusy(true)
    try {
      await api.delete(`${baseUrl}/${faq.id}`)
      await fetchFaqs()
      notifyParent()
    } catch {
      Swal.fire('Error', 'No se pudo eliminar la pregunta frecuente.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleSwap = async (i, j) => {
    if (i < 0 || j < 0 || i >= faqs.length || j >= faqs.length) return
    const a = faqs[i]
    const b = faqs[j]
    setBusy(true)
    try {
      await Promise.all([
        api.put(`${baseUrl}/${a.id}`, { question: a.question, answer: a.answer, displayOrder: j }),
        api.put(`${baseUrl}/${b.id}`, { question: b.question, answer: b.answer, displayOrder: i }),
      ])
      await fetchFaqs()
      notifyParent()
    } catch {
      Swal.fire('Error', 'No se pudo reordenar. Intentá de nuevo.', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="edc-form">
        <p className="edc-placeholder">Cargando preguntas frecuentes…</p>
      </div>
    )
  }

  return (
    <div className="edc-form">
      <div className="rws-intro">
        <p>
          Respondé las <strong>dudas más comunes</strong> antes de que aparezcan. Una buena sección de preguntas frecuentes
          reduce fricción y transmite claridad.
        </p>
        <p>
          Esta sección es <strong>opcional</strong>. Si no agregás preguntas, no se mostrará en la campaña pública.
        </p>
      </div>

      {faqs.length === 0 && !creating && (
        <div className="rws-empty">
          <HelpCircle size={32} />
          <h4>Todavía no agregaste preguntas frecuentes</h4>
          <p>Podés sumar respuestas a las dudas más comunes de tus contribuidores.</p>
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} /> Agregar primera pregunta
          </Button>
        </div>
      )}

      {faqs.length > 0 && (
        <div className="rws-list">
          {faqs.map((faq, i) => (
            <div key={faq.id} className="rws-item">
              {editingId === faq.id ? (
                <FaqEditForm
                  initial={faq}
                  onSave={(data) => handleUpdate(faq.id, data)}
                  onCancel={() => setEditingId(null)}
                  saving={busy}
                />
              ) : (
                <FaqCard
                  faq={faq}
                  index={i}
                  total={faqs.length}
                  onEdit={() => setEditingId(faq.id)}
                  onDelete={() => handleDelete(faq)}
                  onMoveUp={() => handleSwap(i, i - 1)}
                  onMoveDown={() => handleSwap(i, i + 1)}
                  disabled={busy || editingId !== null || creating}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {creating && (
        <div className="rws-item rws-item--new">
          <h4 className="rws-new-title">Nueva pregunta frecuente</h4>
          <FaqEditForm
            initial={null}
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
            saving={busy}
          />
        </div>
      )}

      {faqs.length > 0 && !creating && (
        <button
          className="rws-add-btn"
          onClick={() => setCreating(true)}
          disabled={busy || editingId !== null}
        >
          <Plus size={18} /> Agregar otra pregunta
        </button>
      )}
    </div>
  )
}
