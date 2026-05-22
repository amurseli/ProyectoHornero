import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Save, X, Gift, AlertCircle, Upload, ImageIcon } from 'lucide-react'
import Swal from 'sweetalert2'
import { Button } from '$components/ui'
import api from '$utils/api/api'
import ImageCropModal from '$components/ImageCropModal/ImageCropModal'
import { MAX_IMAGE_BYTES, CROP_ASPECT } from '../campaignFormUtils'

const TITLE_MAX = 200
const DESC_MAX = 600

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
})

function formatPrice(price) {
  const num = Number(price)
  if (Number.isNaN(num)) return '—'
  return priceFormatter.format(num)
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function validate(form) {
  const errors = {}
  if (!form.title || !form.title.trim()) errors.title = 'El título es obligatorio'
  else if (form.title.length > TITLE_MAX) errors.title = `Máximo ${TITLE_MAX} caracteres`
  if (form.price === '' || form.price === null || form.price === undefined) errors.price = 'El precio es obligatorio'
  else if (Number.isNaN(Number(form.price))) errors.price = 'Precio inválido'
  else if (Number(form.price) <= 0) errors.price = 'El precio debe ser mayor a cero'
  if (form.description && form.description.length > DESC_MAX) errors.description = `Máximo ${DESC_MAX} caracteres`
  return errors
}

function RewardEditForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    price: initial?.price ?? '',
    imageBase64: initial?.imageBase64 || null,
  })
  const [errors, setErrors] = useState({})
  const fileRef = useRef()
  const [cropSrc, setCropSrc] = useState(null)

  const onChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const handleImage = (files) => {
    const file = files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      Swal.fire('Archivo inválido', 'Tiene que ser una imagen.', 'error')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      Swal.fire('Imagen demasiado grande', 'El máximo permitido es 10 MB.', 'error')
      return
    }
    setCropSrc(URL.createObjectURL(file))
  }

  const handleSubmit = () => {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSave({
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      imageBase64: form.imageBase64,
    })
  }

  const imgSrc = form.imageBase64 ? `data:image/jpeg;base64,${form.imageBase64}` : null

  return (
    <div className="rws-edit">
      <div className="edc-field">
        <label className="edc-label">Imagen</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { handleImage(e.target.files); e.target.value = '' }}
        />
        <div
          className="rws-image-upload"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleImage(e.dataTransfer.files) }}
        >
          {imgSrc ? (
            <div className="rws-image-preview">
              <img src={imgSrc} alt="Recompensa" />
              <button
                type="button"
                className="rws-image-remove"
                onClick={e => { e.stopPropagation(); onChange('imageBase64', null) }}
                title="Quitar imagen"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="rws-image-empty">
              <Upload size={20} />
              <span>Subí o arrastrá una imagen (máx 10 MB)</span>
            </div>
          )}
        </div>
        <span className="edc-hint edc-hint--left">Se recorta a 16:9 para mantener consistencia visual.</span>
      </div>

      <div className="edc-field">
        <label className="edc-label">Título *</label>
        <input
          className={`edc-input ${errors.title ? 'edc-input--error' : ''}`}
          type="text"
          placeholder="Ej: Edición Coleccionista"
          maxLength={TITLE_MAX}
          value={form.title}
          onChange={e => onChange('title', e.target.value)}
        />
        {errors.title && <span className="edc-error"><AlertCircle size={12} /> {errors.title}</span>}
        <span className="edc-hint">{form.title.length}/{TITLE_MAX}</span>
      </div>

      <div className="edc-field">
        <label className="edc-label">Precio ($) *</label>
        <input
          className={`edc-input ${errors.price ? 'edc-input--error' : ''}`}
          type="number"
          min="1"
          step="1"
          placeholder="5000"
          value={form.price}
          onChange={e => onChange('price', e.target.value)}
        />
        {errors.price && <span className="edc-error"><AlertCircle size={12} /> {errors.price}</span>}
      </div>

      <div className="edc-field">
        <label className="edc-label">Descripción</label>
        <textarea
          className={`edc-textarea ${errors.description ? 'edc-input--error' : ''}`}
          rows={4}
          maxLength={DESC_MAX}
          placeholder="Detallá qué incluye esta recompensa, fechas estimadas de entrega, etc."
          value={form.description}
          onChange={e => onChange('description', e.target.value)}
        />
        {errors.description && <span className="edc-error"><AlertCircle size={12} /> {errors.description}</span>}
        <span className="edc-hint">
          {form.description.length}/{DESC_MAX} caracteres
        </span>
      </div>

      <div className="rws-edit-actions">
        <Button onClick={handleSubmit} disabled={saving}>
          <Save size={16} /> {saving ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          <X size={16} /> Cancelar
        </Button>
      </div>

      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspect={CROP_ASPECT}
          fileName="recompensa.jpg"
          onCancel={() => setCropSrc(null)}
          onConfirm={async ({ file }) => {
            const b64 = await fileToBase64(file)
            onChange('imageBase64', b64)
            setCropSrc(null)
          }}
        />
      )}
    </div>
  )
}

function RewardCard({ reward, onEdit, onDelete, disabled }) {
  const imgSrc = reward.imageBase64 ? `data:image/jpeg;base64,${reward.imageBase64}` : null

  return (
    <div className="rws-card">
      <div className="rws-card-image">
        {imgSrc ? (
          <img src={imgSrc} alt={reward.title} />
        ) : (
          <div className="rws-card-image--placeholder">
            <ImageIcon size={28} />
          </div>
        )}
      </div>
      <div className="rws-card-body">
        <div className="rws-card-price">{formatPrice(reward.price)}</div>
        <h4 className="rws-card-title">{reward.title}</h4>
        {reward.description && <p className="rws-card-desc">{reward.description}</p>}
      </div>
      <div className="rws-card-actions">
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

export default function SectionRewards({ campaign, onSaved }) {
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)

  const baseUrl = `/api/campaigns/${campaign.id}/rewards`

  const fetchRewards = async () => {
    try {
      const data = await api.get(baseUrl)
      const sorted = [...(data || [])].sort(
        (a, b) => Number(a.price ?? 0) - Number(b.price ?? 0) || (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
      )
      setRewards(sorted)
    } catch (err) {
      Swal.fire('Error', 'No se pudieron cargar las recompensas.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRewards()
  }, [campaign.id])

  const notifyParent = () => {
    if (onSaved) onSaved()
  }

  const handleCreate = async (data) => {
    setBusy(true)
    try {
      await api.post(baseUrl, { ...data, displayOrder: rewards.length })
      setCreating(false)
      await fetchRewards()
      notifyParent()
    } catch (err) {
      Swal.fire('Error', 'No se pudo crear la recompensa. Intentá de nuevo.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleUpdate = async (id, data) => {
    setBusy(true)
    try {
      const current = rewards.find(r => r.id === id)
      await api.put(`${baseUrl}/${id}`, { ...data, displayOrder: current?.displayOrder ?? 0 })
      setEditingId(null)
      await fetchRewards()
      notifyParent()
    } catch (err) {
      Swal.fire('Error', 'No se pudo guardar la recompensa. Intentá de nuevo.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (reward) => {
    const result = await Swal.fire({
      title: '¿Eliminar recompensa?',
      html: `Estás por eliminar <strong>${reward.title}</strong>. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    })
    if (!result.isConfirmed) return

    setBusy(true)
    try {
      await api.delete(`${baseUrl}/${reward.id}`)
      await fetchRewards()
      notifyParent()
    } catch (err) {
      Swal.fire('Error', 'No se pudo eliminar la recompensa.', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="edc-form">
        <p className="edc-placeholder">Cargando recompensas…</p>
      </div>
    )
  }

  return (
    <div className="edc-form">
      <div className="rws-intro">
        <p>
          Definí los <strong>tiers de contribución</strong> que ofrecerás a tus patrocinadores. Cada tier
          tiene un precio fijo y describe qué recibe quien contribuye en ese nivel.
        </p>
        <p>
          Conviene ofrecer al menos 3 tiers cubriendo distintos rangos de precio. Pensá en
          recompensas tangibles (productos, ediciones especiales) y simbólicas (agradecimientos,
          acceso anticipado, etc).
        </p>
        <p>
          Las recompensas se muestran automáticamente de <strong>menor a mayor precio</strong>.
        </p>
      </div>

      {rewards.length === 0 && !creating && (
        <div className="rws-empty">
          <Gift size={32} />
          <h4>Todavía no tenés recompensas</h4>
          <p>Agregá tu primera recompensa para que tus patrocinadores tengan algo por lo que contribuir.</p>
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} /> Agregar primera recompensa
          </Button>
        </div>
      )}

      {rewards.length > 0 && (
        <div className="rws-list">
          {rewards.map((reward) => (
            <div key={reward.id} className="rws-item">
              {editingId === reward.id ? (
                <RewardEditForm
                  initial={reward}
                  onSave={(data) => handleUpdate(reward.id, data)}
                  onCancel={() => setEditingId(null)}
                  saving={busy}
                />
              ) : (
                <RewardCard
                  reward={reward}
                  onEdit={() => setEditingId(reward.id)}
                  onDelete={() => handleDelete(reward)}
                  disabled={busy || editingId !== null || creating}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {creating && (
        <div className="rws-item rws-item--new">
          <h4 className="rws-new-title">Nueva recompensa</h4>
          <RewardEditForm
            initial={null}
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
            saving={busy}
          />
        </div>
      )}

      {rewards.length > 0 && !creating && (
        <button
          className="rws-add-btn"
          onClick={() => setCreating(true)}
          disabled={busy || editingId !== null}
        >
          <Plus size={18} /> Agregar otra recompensa
        </button>
      )}
    </div>
  )
}
