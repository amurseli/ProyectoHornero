import { ArrowRight } from "lucide-react"
import "./TwoPaths.css"

// ─────────────────────────────────────────────────────────────────────────────
//  TwoPaths — bloque de texto continuo ("qué hacemos") + dos columnas grandes que
//  bifurcan al usuario ("Si querés aportar" / "Si querés crear"). Los paneles son
//  informativos (NO interactivos, no se resaltan al hover); la acción vive en un
//  link estilo texto-subrayado + flecha.
//    <TwoPaths
//      aboutTitle="…"          // opcional
//      about={<>…párrafos…</>} // ReactNode: 1–2 párrafos de texto continuo
//      paths={[{ icon, kicker, title, desc, linkLabel, onLink }, …2]}
//    />
// ─────────────────────────────────────────────────────────────────────────────

function TwoPaths({ aboutTitle, about, paths = [] }) {
  return (
    <section className="tp">
      {about && (
        <div className="tp-about">
          {aboutTitle && <h2 className="tp-about-title">{aboutTitle}</h2>}
          <div className="tp-about-body">{about}</div>
        </div>
      )}

      <div className="tp-cols">
        {paths.map((p, i) => {
          const Icon = p.icon
          return (
            <div className="tp-card" key={i}>
              <span className="tp-card-glow" aria-hidden="true" />
              <div className="tp-card-inner">
                {Icon && (
                  <div className="tp-icon">
                    <Icon size={26} strokeWidth={1.8} />
                  </div>
                )}
                {p.kicker && <span className="tp-kicker">{p.kicker}</span>}
                <h3 className="tp-card-title">{p.title}</h3>
                {p.desc && <p className="tp-card-desc">{p.desc}</p>}
                {p.linkLabel && (
                  <button type="button" className="tp-link" onClick={p.onLink}>
                    <span className="tp-link-label">{p.linkLabel}</span>
                    <ArrowRight size={16} strokeWidth={2.2} className="tp-link-icon" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default TwoPaths
