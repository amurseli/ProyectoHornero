import SectionHeading from "../SectionHeading/SectionHeading.jsx"
import "./HeadedSection.css"

// ─────────────────────────────────────────────────────────────────────────────
//  HeadedSection — sección con encabezado (SectionHeading) + slot libre para el
//  contenido (children). Pensado para envolver un centerpiece visual, p.ej. la
//  red interactiva.
//    <HeadedSection eyebrow="…" title="…" subtitle="…">
//      <TrustNetwork … />
//    </HeadedSection>
// ─────────────────────────────────────────────────────────────────────────────

function HeadedSection({ eyebrow, title, subtitle, children }) {
  return (
    <section className="hs">
      {(eyebrow || title || subtitle) && (
        <div className="hs-intro">
          <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
        </div>
      )}

      {children && <div className="hs-slot">{children}</div>}
    </section>
  )
}

export default HeadedSection
