import { useState, useRef } from 'react'
import { Save, Upload, X } from 'lucide-react'
import { Button } from '$components/ui'
import api from '$utils/api/api'

const CATEGORIES = [
  { id: 1, name: 'Arte' },
  { id: 2, name: 'Cine' },
  { id: 3, name: 'Diseño' },
  { id: 4, name: 'Educación' },
  { id: 5, name: 'Juegos' },
  { id: 6, name: 'Música' },
  { id: 7, name: 'Publicaciones' },
  { id: 8, name: 'Tecnología' },
  { id: 9, name: 'Otro' },
]

const COUNTRIES = ['Argentina', 'Brasil', 'Chile', 'Colombia', 'México', 'Perú', 'Uruguay', 'Estados Unidos', 'España', 'Otro']

function getImageUrl(campaign) {
  const primary = campaign.media?.find(m => m.isPrimary) || campaign.media?.find(m => m.mediaType === 'IMAGE')
  if (primary?.base64Data) return `data:image/jpeg;base64,${primary.base64Data}`
  if (primary?.url) return primary.url
  return null
}

function getVideoUrl(campaign) {
  const video = campaign.media?.find(m => m.mediaType === 'VIDEO')
  return video?.url || ''
}

export default function SectionBasicos({ campaign, onSaved }) {
  const [form, setForm] = useState({
    title: campaign.title || '',
    shortDescription: campaign.shortDescription || '',
    categoryId: campaign.category?.id || '',
    country: campaign.country || '',
    targetAmount: campaign.targetAmount || '',
    endDate: campaign.endDate || '',
    videoUrl: getVideoUrl(campaign),
  })
  const [coverPreview, setCoverPreview] = useState(getImageUrl(campaign))
  const [coverFile, setCoverFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const coverRef = useRef()

  const onChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleCover = (files) => {
    const file = files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    setSaved(false)
  }

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const media = [...(campaign.media || []).filter(m => m.mediaType !== 'VIDEO')]

      if (coverFile) {
        const base64Data = await toBase64(coverFile)
        const existingPrimary = media.findIndex(m => m.isPrimary)
        const coverMedia = {
          base64Data,
          mediaType: 'IMAGE',
          isPrimary: true,
          displayOrder: 0,
        }
        if (existingPrimary >= 0) media[existingPrimary] = coverMedia
        else media.unshift(coverMedia)
      }

      if (form.videoUrl) {
        media.push({ url: form.videoUrl, mediaType: 'VIDEO', isPrimary: false, displayOrder: media.length })
      }

      const categoryObj = CATEGORIES.find(c => c.id === Number(form.categoryId))

      await api.put(`/api/campaigns/${campaign.id}`, {
        title: form.title,
        shortDescription: form.shortDescription,
        description: campaign.description,
        country: form.country,
        targetAmount: form.targetAmount ? Number(form.targetAmount) : null,
        endDate: form.endDate || null,
        status: campaign.status,
        owner: { id: campaign.owner?.id },
        category: categoryObj ? { id: categoryObj.id } : campaign.category,
        media,
      })

      setSaved(true)
      if (onSaved) onSaved()
    } catch (err) {
      alert('Error al guardar: ' + (err.message || 'Intentá de nuevo'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="edc-form">
      <div className="edc-field">
        <label className="edc-label">Título</label>
        <input className="edc-input" type="text" placeholder="El nombre de tu proyecto"
          value={form.title} onChange={e => onChange('title', e.target.value)} />
      </div>

      <div className="edc-field">
        <label className="edc-label">Descripción corta</label>
        <textarea className="edc-textarea" rows={3} placeholder="Una frase que resuma tu proyecto"
          value={form.shortDescription} onChange={e => onChange('shortDescription', e.target.value)} />
        <span className="edc-hint">{form.shortDescription.length}/200 caracteres</span>
      </div>

      <div className="edc-row">
        <div className="edc-field">
          <label className="edc-label">Categoría</label>
          <select className="edc-select" value={form.categoryId} onChange={e => onChange('categoryId', e.target.value)}>
            <option value="">Seleccioná</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="edc-field">
          <label className="edc-label">País</label>
          <select className="edc-select" value={form.country} onChange={e => onChange('country', e.target.value)}>
            <option value="">Seleccioná</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="edc-row">
        <div className="edc-field">
          <label className="edc-label">Monto objetivo (US$)</label>
          <input className="edc-input" type="number" min="1" placeholder="10000"
            value={form.targetAmount} onChange={e => onChange('targetAmount', e.target.value)} />
        </div>
        <div className="edc-field">
          <label className="edc-label">Fecha de fin</label>
          <input className="edc-input" type="date"
            value={form.endDate} onChange={e => onChange('endDate', e.target.value)} />
        </div>
      </div>

      <div className="edc-field">
        <label className="edc-label">Imagen de portada</label>
        <div className="edc-upload" onClick={() => coverRef.current.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleCover(e.dataTransfer.files) }}>
          {coverPreview
            ? <div className="edc-upload-preview">
                <img src={coverPreview} alt="Portada" />
                <button className="edc-upload-remove" onClick={e => { e.stopPropagation(); setCoverPreview(null); setCoverFile(null); setSaved(false) }}>
                  <X size={14} />
                </button>
              </div>
            : <div className="edc-upload-empty">
                <Upload size={24} />
                <span>Hacé clic o arrastrá una imagen</span>
              </div>
          }
        </div>
        <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => handleCover(e.target.files)} />
      </div>

      <div className="edc-field">
        <label className="edc-label">URL de video <span className="edc-optional">opcional</span></label>
        <input className="edc-input" type="url" placeholder="https://youtube.com/watch?v=..."
          value={form.videoUrl} onChange={e => onChange('videoUrl', e.target.value)} />
      </div>

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