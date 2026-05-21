import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Save, X, Users, Upload, User } from 'lucide-react'
import Swal from 'sweetalert2'
import { Button } from '$components/ui'
import api from '$utils/api/api'
import ImageCropModal from '$components/ImageCropModal/ImageCropModal'

const NAME_MAX = 200
const ROLE_MAX = 200
const BIO_MAX  = 600
const MAX_IMAGE_BYTES = 10 * 1024 * 1024   // 10 MB

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
  if (!form.name || !form.name.trim()) errors.name = 'El nombre es obligatorio'
  else if (form.name.length > NAME_MAX) errors.name = `Máximo ${NAME_MAX} caracteres`
  if (form.role && form.role.length > ROLE_MAX) errors.role = `Máximo ${ROLE_MAX} caracteres`
  return errors
}

function MemberEditForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    role: initial?.role || '',
    bio: initial?.bio || '',
    imageBase64: initial?.imageBase64 || null,
  })
  const [errors, setErrors] = useState({})
  const [cropSrc, setCropSrc] = useState(null)

  const onChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const pickImage = (files) => {
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
      name: form.name.trim(),
      role: form.role.trim() || null,
      bio: form.bio.trim() || null,
      imageBase64: form.imageBase64,
    })
  }

  const imgSrc = form.imageBase64 ? `data:image/jpeg;base64,${form.imageBase64}` : null

  return (
    <div className="rws-edit">
      <div className="edc-field">
        <label className="edc-label">Foto</label>
        <div className="tms-photo-row">
          <div className="tms-avatar tms-avatar--lg">
            {imgSrc ? <img src={imgSrc} alt="" /> : <User size={28} />}
          </div>
          <div className="tms-photo-actions">
            <label className="tms-photo-btn">
              <Upload size={14} /> {imgSrc ? 'Cambiar foto' : 'Subir foto'}
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { pickImage(e.target.files); e.target.value = '' }} />
            </label>
            {imgSrc && (
              <button type="button" className="tms-photo-remove" onClick={() => onChange('imageBase64', null)}>
                <X size={14} /> Quitar
              </button>
            )}
            <span className="edc-hint edc-hint--left">Cuadrada · hasta 10 MB · se recorta 1:1</span>
          </div>
        </div>
      </div>

      <div className="edc-field">
        <label className="edc-label">Nombre *</label>
        <input
          className={`edc-input ${errors.name ? 'edc-input--error' : ''}`}
          type="text"
          placeholder="Ej: María González"
          maxLength={NAME_MAX}
          value={form.name}
          onChange={e => onChange('name', e.target.value)}
        />
        {errors.name && <span className="edc-error">{errors.name}</span>}
      </div>

      <div className="edc-field">
        <label className="edc-label">Rol <span className="edc-optional">en el proyecto</span></label>
        <input
          className={`edc-input ${errors.role ? 'edc-input--error' : ''}`}
          type="text"
          placeholder="Ej: Fundadora y directora creativa"
          maxLength={ROLE_MAX}
          value={form.role}
          onChange={e => onChange('role', e.target.value)}
        />
        {errors.role && <span className="edc-error">{errors.role}</span>}
      </div>

      <div className="edc-field">
        <label className="edc-label">Biografía</label>
        <textarea
          className="edc-textarea"
          rows={4}
          maxLength={BIO_MAX}
          placeholder="Contá quién es y qué aporta al proyecto."
          value={form.bio}
          onChange={e => onChange('bio', e.target.value)}
        />
        <span className="edc-hint">{form.bio.length}/{BIO_MAX} caracteres</span>
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
          aspect={1}
          fileName="integrante.jpg"
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

function MemberCard({ member, index, total, onEdit, onDelete, onMoveUp, onMoveDown, disabled }) {
  const imgSrc = member.imageBase64 ? `data:image/jpeg;base64,${member.imageBase64}` : null

  return (
    <div className="tms-card">
      <div className="tms-avatar">
        {imgSrc ? <img src={imgSrc} alt={member.name} /> : <User size={26} />}
      </div>
      <div className="tms-card-body">
        <h4 className="tms-card-name">{member.name}</h4>
        {member.role && <p className="tms-card-role">{member.role}</p>}
        {member.bio && <p className="tms-card-bio">{member.bio}</p>}
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

export default function SectionTeam({ campaign, onSaved }) {
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)

  const baseUrl = `/api/campaigns/${campaign.id}/team`

  const fetchTeam = async () => {
    try {
      const data = await api.get(baseUrl)
      const sorted = [...(data || [])].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      setTeam(sorted)
    } catch {
      Swal.fire('Error', 'No se pudo cargar el equipo.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTeam() }, [campaign.id])

  const notifyParent = () => { if (onSaved) onSaved() }

  const handleCreate = async (data) => {
    setBusy(true)
    try {
      await api.post(baseUrl, { ...data, displayOrder: team.length })
      setCreating(false)
      await fetchTeam()
      notifyParent()
    } catch {
      Swal.fire('Error', 'No se pudo agregar al integrante. Intentá de nuevo.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleUpdate = async (id, data) => {
    setBusy(true)
    try {
      const current = team.find(m => m.id === id)
      await api.put(`${baseUrl}/${id}`, { ...data, displayOrder: current?.displayOrder ?? 0 })
      setEditingId(null)
      await fetchTeam()
      notifyParent()
    } catch {
      Swal.fire('Error', 'No se pudo guardar. Intentá de nuevo.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (member) => {
    const result = await Swal.fire({
      title: '¿Eliminar integrante?',
      html: `Estás por quitar a <strong>${member.name}</strong> del equipo.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    })
    if (!result.isConfirmed) return

    setBusy(true)
    try {
      await api.delete(`${baseUrl}/${member.id}`)
      await fetchTeam()
      notifyParent()
    } catch {
      Swal.fire('Error', 'No se pudo eliminar al integrante.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleSwap = async (i, j) => {
    if (i < 0 || j < 0 || i >= team.length || j >= team.length) return
    const a = team[i]
    const b = team[j]
    setBusy(true)
    try {
      await Promise.all([
        api.put(`${baseUrl}/${a.id}`, { name: a.name, role: a.role, bio: a.bio, imageBase64: a.imageBase64, displayOrder: j }),
        api.put(`${baseUrl}/${b.id}`, { name: b.name, role: b.role, bio: b.bio, imageBase64: b.imageBase64, displayOrder: i }),
      ])
      await fetchTeam()
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
        <p className="edc-placeholder">Cargando equipo…</p>
      </div>
    )
  }

  return (
    <div className="edc-form">
      <div className="rws-intro">
        <p>
          Presentá a las <strong>personas detrás del proyecto</strong>. Los contribuidores confían más
          en campañas con un equipo visible: mostrá quién hace qué y por qué están capacitados para
          llevarlo adelante.
        </p>
        <p>
          Agregá al menos a la persona responsable. Para cada integrante podés indicar su
          <strong> nombre</strong>, su <strong>rol</strong> y una breve <strong>biografía</strong>.
        </p>
      </div>

      {team.length === 0 && !creating && (
        <div className="rws-empty">
          <Users size={32} />
          <h4>Todavía no agregaste integrantes</h4>
          <p>Sumá a las personas que forman parte del proyecto para generar confianza.</p>
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} /> Agregar primer integrante
          </Button>
        </div>
      )}

      {team.length > 0 && (
        <div className="rws-list">
          {team.map((member, i) => (
            <div key={member.id} className="rws-item">
              {editingId === member.id ? (
                <MemberEditForm
                  initial={member}
                  onSave={(data) => handleUpdate(member.id, data)}
                  onCancel={() => setEditingId(null)}
                  saving={busy}
                />
              ) : (
                <MemberCard
                  member={member}
                  index={i}
                  total={team.length}
                  onEdit={() => setEditingId(member.id)}
                  onDelete={() => handleDelete(member)}
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
          <h4 className="rws-new-title">Nuevo integrante</h4>
          <MemberEditForm
            initial={null}
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
            saving={busy}
          />
        </div>
      )}

      {team.length > 0 && !creating && (
        <button
          className="rws-add-btn"
          onClick={() => setCreating(true)}
          disabled={busy || editingId !== null}
        >
          <Plus size={18} /> Agregar otro integrante
        </button>
      )}
    </div>
  )
}
