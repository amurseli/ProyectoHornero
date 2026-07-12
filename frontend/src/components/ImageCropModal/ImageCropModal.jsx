import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, X, ZoomIn } from 'lucide-react'
import { Button } from '$components/ui'
import './ImageCropModal.css'

// Fallback output width when there's no size budget (maxBytes). The height is
// derived from the crop aspect so every surface shows the result identically.
const OUT_WIDTH = 1600
const MAX_ZOOM  = 3

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

/**
 * Dependency-free image cropper.  The stage IS the crop frame (a fixed-aspect
 * window); the user pans by dragging and zooms with the slider.  The image is
 * always kept large enough to cover the frame.  On confirm, the visible region
 * is drawn to a canvas and returned as a JPEG File.
 *
 * Props:
 *   src        — object/data URL of the image being cropped
 *   aspect     — crop aspect ratio (default 16/9)
 *   fileName   — name for the resulting File
 *   maxBytes   — optional size budget for the exported file. When set, the
 *                output resolution scales to use that budget (full quality is
 *                kept; only the dimensions shrink if the file would exceed it).
 *   title      — heading shown above the stage
 *   description— instructional text below the heading (section-specific)
 *   onCancel() — user dismissed without cropping
 *   onConfirm({ file, previewUrl }) — user accepted the crop
 */
export default function ImageCropModal({
  src,
  aspect = 16 / 9,
  fileName = 'imagen.jpg',
  maxBytes = 0,
  title = 'Recortá tu imagen',
  description = 'Arrastrá y usá el zoom para encuadrar la imagen — así se verá igual en todo el sitio.',
  onCancel,
  onConfirm,
}) {
  const isSquare = Math.abs(aspect - 1) < 0.001
  const stageRef = useRef(null)
  const imgRef   = useRef(null)
  const dragRef  = useRef(null)

  const [ready, setReady] = useState(false)
  const [zoom, setZoom]   = useState(1)
  const [pos, setPos]     = useState({ x: 0, y: 0 })
  const [busy, setBusy]   = useState(false)

  // Geometry captured once the image + stage are measured
  const geo = useRef({ natW: 0, natH: 0, baseScale: 1, stageW: 0, stageH: 0 })

  const displayed = () => {
    const { natW, natH, baseScale } = geo.current
    return { dw: natW * baseScale * zoom, dh: natH * baseScale * zoom }
  }

  const clampPos = useCallback((x, y, dw, dh) => {
    const { stageW, stageH } = geo.current
    return {
      x: clamp(x, stageW - dw, 0),
      y: clamp(y, stageH - dh, 0),
    }
  }, [])

  // Measure once the image has loaded
  const handleLoad = () => {
    const img = imgRef.current
    const stage = stageRef.current
    if (!img || !stage) return
    const rect = stage.getBoundingClientRect()
    const natW = img.naturalWidth
    const natH = img.naturalHeight
    // "cover" base scale — smallest scale that fills the stage
    const baseScale = Math.max(rect.width / natW, rect.height / natH)
    geo.current = { natW, natH, baseScale, stageW: rect.width, stageH: rect.height }
    const dw = natW * baseScale
    const dh = natH * baseScale
    setZoom(1)
    setPos({ x: (rect.width - dw) / 2, y: (rect.height - dh) / 2 })
    setReady(true)
  }

  // ── Zoom (keeps the stage-centre image point fixed) ──────────────────
  const applyZoom = (z) => {
    const next = clamp(z, 1, MAX_ZOOM)
    const { natW, natH, baseScale, stageW, stageH } = geo.current
    const oldDw = natW * baseScale * zoom
    const oldDh = natH * baseScale * zoom
    const newDw = natW * baseScale * next
    const newDh = natH * baseScale * next
    const cx = (stageW / 2 - pos.x) / oldDw
    const cy = (stageH / 2 - pos.y) / oldDh
    const nx = stageW / 2 - cx * newDw
    const ny = stageH / 2 - cy * newDh
    setZoom(next)
    setPos(clampPos(nx, ny, newDw, newDh))
  }

  // ── Drag to pan ──────────────────────────────────────────────────────
  const onPointerDown = (e) => {
    if (!ready) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y }
  }
  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const { dw, dh } = displayed()
    setPos(clampPos(d.ox + (e.clientX - d.px), d.oy + (e.clientY - d.py), dw, dh))
  }
  const endDrag = (e) => {
    if (dragRef.current && e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    dragRef.current = null
  }

  // Esc to cancel
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  // Wheel-to-zoom sobre la imagen. Usamos un listener nativo no-pasivo para poder
  // hacer preventDefault (así la rueda hace zoom en vez de scrollear la página).
  // Refs para leer siempre el zoom/applyZoom más recientes desde el listener.
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const applyZoomRef = useRef(applyZoom)
  applyZoomRef.current = applyZoom
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const onWheel = (e) => {
      e.preventDefault()
      applyZoomRef.current(zoomRef.current - e.deltaY * 0.0015)
    }
    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [])

  const handleConfirm = async () => {
    if (!ready) return
    setBusy(true)
    try {
      const { natW, natH, baseScale, stageW, stageH } = geo.current
      const scale = baseScale * zoom
      // Visible region mapped back to natural-image coordinates
      const sx = clamp(-pos.x / scale, 0, natW)
      const sy = clamp(-pos.y / scale, 0, natH)
      const sw = Math.min(stageW / scale, natW - sx)
      const sh = Math.min(stageH / scale, natH - sy)

      // Codifica el recorte a un ancho dado, manteniendo la calidad JPEG constante.
      const renderBlob = (outW) => {
        const w = Math.max(1, Math.round(outW))
        const h = Math.max(1, Math.round(outW / aspect))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, w, h)
        return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
      }

      // Sin presupuesto de peso: ancho fijo (OUT_WIDTH). Con presupuesto: partimos
      // de la resolución natural del recorte y, si el archivo supera el máximo,
      // achicamos SOLO las dimensiones (la calidad no cambia) hasta que entre.
      let outW = maxBytes ? sw : OUT_WIDTH
      let blob = await renderBlob(outW)
      let guard = 0
      while (maxBytes && blob && blob.size > maxBytes && outW > 320 && guard < 20) {
        // El peso ~ área ~ ancho², así que escalamos por la raíz de la relación
        // (con un pequeño margen) para converger en pocas iteraciones.
        outW = outW * Math.sqrt(maxBytes / blob.size) * 0.95
        blob = await renderBlob(outW)
        guard++
      }

      if (!blob) {
        setBusy(false)
        return
      }
      const file = new File([blob], fileName, { type: 'image/jpeg' })
      onConfirm({ file, previewUrl: URL.createObjectURL(blob) })
    } catch {
      setBusy(false)
    }
  }

  const { dw, dh } = displayed()

  return (
    <div className="crop-overlay" onClick={onCancel}>
      <div className={`crop-modal ${isSquare ? 'crop-modal--square' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="crop-header">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        <div
          className={`crop-stage ${isSquare ? 'crop-stage--square' : ''}`}
          ref={stageRef}
          style={{ aspectRatio: String(aspect) }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={handleLoad}
            className="crop-image"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              width: `${dw}px`,
              height: `${dh}px`,
              visibility: ready ? 'visible' : 'hidden',
            }}
          />
          <div className="crop-grid" aria-hidden="true" />
        </div>

        <div className="crop-zoom">
          <ZoomIn size={16} />
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={e => applyZoom(Number(e.target.value))}
            disabled={!ready}
          />
        </div>

        <div className="crop-actions">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            <X size={16} /> Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={busy || !ready}>
            <Check size={16} /> {busy ? 'Procesando…' : 'Usar recorte'}
          </Button>
        </div>
      </div>
    </div>
  )
}
