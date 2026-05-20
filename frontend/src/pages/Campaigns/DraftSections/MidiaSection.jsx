import { useEffect, useMemo, useRef, useState } from 'react'
import { Save, Upload, X, GripVertical, ArrowLeft, ArrowRight, Image as ImageIcon, Film } from 'lucide-react'
import { Button } from '$components/ui'
import api from '$utils/api/api'
import ImageCropModal from '$components/ImageCropModal/ImageCropModal'
import { MAX_IMAGE_BYTES, CROP_ASPECT } from '../campaignFormUtils'

// Gallery cap — 6 images, on top of the mandatory cover (managed in Básicos)
const MAX_GALLERY = 6

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function mediaSrc(m) {
  if (m.previewUrl) return m.previewUrl
  if (m.base64Data) return `data:image/jpeg;base64,${m.base64Data}`
  return m.url || ''
}

/**
 * Splits the campaign media into the parts this section manages:
 *   - cover:   the primary image (managed in Básicos — preserved on save)
 *   - gallery: ordered non-primary IMAGE entries (max 6, reorderable)
 *   - videoUrl: first VIDEO entry's URL
 */
function splitMedia(media = []) {
  const images = media.filter(m => m.mediaType === 'IMAGE')
  const videos = media.filter(m => m.mediaType === 'VIDEO')
  const cover = images.find(m => m.isPrimary) || null
  const gallery = images
    .filter(m => m !== cover)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
  return { cover, gallery, videoUrl: videos[0]?.url || '' }
}

export default function SectionMidia({ campaign, onSaved }) {
  const initial = useMemo(() => splitMedia(campaign.media || []), [campaign.media])

  const [gallery, setGallery]   = useState(initial.gallery)
  const [videoUrl, setVideoUrl] = useState(initial.videoUrl)
  const [error, setError]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [dragIndex, setDragIndex] = useState(null)
  const [cropQueue, setCropQueue] = useState([])   // pending object URLs to crop

  const galleryInputRef = useRef(null)

  // The cover (primary image) is owned by the Básicos section — preserved as-is here.
  const cover = initial.cover

  useEffect(() => {
    const s = splitMedia(campaign.media || [])
    setGallery(s.gallery)
    setVideoUrl(s.videoUrl)
  }, [campaign.media])

  // ── Gallery: pick files → queue them for 16:9 cropping ────────────────
  const handleGalleryFiles = (files) => {
    const incoming = Array.from(files || [])
    if (!incoming.length) return

    const remainingSlots = MAX_GALLERY - gallery.length - cropQueue.length
    if (remainingSlots <= 0) {
      setError(`Sólo se permiten hasta ${MAX_GALLERY} imágenes en la galería.`)
      return
    }
    const urls = []
    for (const file of incoming.slice(0, remainingSlots)) {
      if (file.size > MAX_IMAGE_BYTES) {
        setError(`La imagen "${file.name}" supera los 10 MB y fue descartada.`)
        continue
      }
      urls.push(URL.createObjectURL(file))
    }
    if (urls.length) {
      setError('')
      setCropQueue(prev => [...prev, ...urls])
      if (incoming.length > remainingSlots) {
        setError(`Sólo se permiten hasta ${MAX_GALLERY} imágenes — se ignoraron las extras.`)
      }
    }
  }

  const removeGallery = (idx) => {
    setGallery(prev => prev.filter((_, i) => i !== idx))
    setSaved(false)
  }

  // ── Reordering ───────────────────────────────────────────────────────
  const moveGallery = (from, to) => {
    if (from === to || to < 0 || to >= gallery.length) return
    setGallery(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setSaved(false)
  }

  const handleDragStart = (idx) => setDragIndex(idx)
  const handleDragOver = (e) => e.preventDefault()
  const handleDrop = (idx) => {
    if (dragIndex == null) return
    moveGallery(dragIndex, idx)
    setDragIndex(null)
  }

  // ── Save ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (gallery.length > MAX_GALLERY) {
      setError(`Sólo se permiten hasta ${MAX_GALLERY} imágenes en la galería.`)
      return
    }

    setSaving(true)
    setError('')
    try {
      // Order matters: cover first, then gallery (in displayed order), then video.
      const media = []
      let order = 0

      if (cover) {
        media.push({
          base64Data: cover.base64Data || null,
          url: cover.url || null,
          mediaType: 'IMAGE',
          isPrimary: true,
          displayOrder: order++,
        })
      }

      for (const g of gallery) {
        if (g._file) {
          media.push({
            base64Data: await fileToBase64(g._file),
            mediaType: 'IMAGE',
            isPrimary: false,
            displayOrder: order++,
          })
        } else {
          media.push({
            base64Data: g.base64Data || null,
            url: g.url || null,
            mediaType: 'IMAGE',
            isPrimary: false,
            displayOrder: order++,
          })
        }
      }

      if (videoUrl && videoUrl.trim()) {
        media.push({ url: videoUrl.trim(), mediaType: 'VIDEO', isPrimary: false, displayOrder: order++ })
      }

      await api.put(`/api/campaigns/${campaign.id}`, {
        title: campaign.title,
        shortDescription: campaign.shortDescription,
        description: campaign.description,
        country: campaign.country,
        targetAmount: campaign.targetAmount,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        status: campaign.status,
        owner: campaign.owner ? { id: campaign.owner.id } : null,
        category: campaign.category ? { id: campaign.category.id } : null,
        media,
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
      <p className="edc-historia-intro" style={{ marginBottom: 0 }}>
        Sumá un <strong>video</strong> de YouTube/Vimeo y hasta{' '}
        <strong>{MAX_GALLERY} imágenes</strong> de galería (máx. 10 MB c/u, se recortan a 16:9).
        El orden se respeta tal cual se ve abajo — arrastrá las tarjetas para reordenarlas.
      </p>

      {/* ── Video ─────────────────────────────────────────────────────── */}
      <div className="edc-field">
        <label className="edc-label">
          <Film size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          URL de video
        </label>
        <input className="edc-input" type="url" placeholder="https://youtube.com/watch?v=..."
          value={videoUrl} onChange={e => { setVideoUrl(e.target.value); setSaved(false) }} />
      </div>

      {/* ── Gallery ───────────────────────────────────────────────────── */}
      <div className="edc-field">
        <label className="edc-label">
          <ImageIcon size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          Galería <span className="edc-optional">{gallery.length}/{MAX_GALLERY} imágenes — arrastrá para reordenar</span>
        </label>

        <div className="midia-grid">
          {gallery.map((g, idx) => (
            <div
              key={(g.id ?? 'new') + '-' + idx}
              className={`midia-thumb ${dragIndex === idx ? 'midia-thumb--dragging' : ''}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(idx)}
            >
              <img src={mediaSrc(g)} alt={`Imagen ${idx + 1}`} />
              <span className="midia-thumb-order">{idx + 1}</span>
              <button className="midia-thumb-handle" title="Arrastrá para reordenar" type="button">
                <GripVertical size={14} />
              </button>
              <div className="midia-thumb-actions">
                <button type="button" title="Mover izquierda" onClick={() => moveGallery(idx, idx - 1)} disabled={idx === 0}>
                  <ArrowLeft size={14} />
                </button>
                <button type="button" title="Mover derecha" onClick={() => moveGallery(idx, idx + 1)} disabled={idx === gallery.length - 1}>
                  <ArrowRight size={14} />
                </button>
                <button type="button" title="Eliminar" className="midia-thumb-remove" onClick={() => removeGallery(idx)}>
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}

          {gallery.length + cropQueue.length < MAX_GALLERY && (
            <button
              type="button"
              className="midia-add"
              onClick={() => galleryInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleGalleryFiles(e.dataTransfer.files) }}
            >
              <Upload size={18} />
              <span>Agregar imagen</span>
              <span className="midia-add-hint">PNG/JPG/WEBP · hasta 10 MB</span>
            </button>
          )}
        </div>
        <input ref={galleryInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={e => { handleGalleryFiles(e.target.files); e.target.value = '' }} />
      </div>

      {error && <p className="auth-error" style={{ margin: 0 }}>{error}</p>}

      <div className="edc-save-row">
        <Button variant="primary" size="md" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
        {saved && <span className="edc-saved-msg">Guardado correctamente</span>}
      </div>

      {cropQueue.length > 0 && (
        <ImageCropModal
          src={cropQueue[0]}
          aspect={CROP_ASPECT}
          fileName="galeria.jpg"
          onCancel={() => setCropQueue(q => q.slice(1))}
          onConfirm={({ file, previewUrl }) => {
            setGallery(prev => [...prev, { _file: file, previewUrl, isPrimary: false, mediaType: 'IMAGE' }])
            setSaved(false)
            setCropQueue(q => q.slice(1))
          }}
        />
      )}
    </div>
  )
}
