import { HeroButton } from "$components/ui"
import "./CrossLinkBanner.css"

// ─────────────────────────────────────────────────────────────────────────────
//  CrossLinkBanner — banner slim de cross-link (ej. "¿Sos creador?"). Texto a la
//  izquierda + HeroButton (blanco + backlight) a la derecha. Sin gradiente de
//  relleno; el backlight lo pone el botón.
//    <CrossLinkBanner title="¿Sos creador?" desc="…" buttonLabel="…" onButton={} />
// ─────────────────────────────────────────────────────────────────────────────

function CrossLinkBanner({ title, desc, buttonLabel, onButton }) {
  return (
    <section className="clb">
      <div className="clb-panel">
        <div className="clb-text">
          <h3 className="clb-title">{title}</h3>
          {desc && <p className="clb-desc">{desc}</p>}
        </div>
        {buttonLabel && <HeroButton onClick={onButton}>{buttonLabel}</HeroButton>}
      </div>
    </section>
  )
}

export default CrossLinkBanner
