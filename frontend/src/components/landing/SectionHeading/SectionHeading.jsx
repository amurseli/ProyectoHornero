import "./SectionHeading.css"

// ─────────────────────────────────────────────────────────────────────────────
//  SectionHeading — el trío de encabezado de sección reutilizado en la landing:
//  eyebrow (mayúsculas doradas) + título (--font-display) + subtítulo. Es un fragmento:
//  el wrapper (max-width / margen / text-align) lo pone quien lo consume.
//    <SectionHeading eyebrow="…" title={…} subtitle="…" subMaxWidth="44ch" />
//  - Si no hay subtítulo, el título queda como :last-child → sin margen inferior.
//  - subMaxWidth (opcional) ajusta la medida del subtítulo (default 46ch en CSS).
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeading({ eyebrow, title, subtitle, subMaxWidth }) {
  return (
    <>
      {eyebrow && <span className="sh-eyebrow">{eyebrow}</span>}
      {title && <h2 className="sh-title">{title}</h2>}
      {subtitle && (
        <p className="sh-sub" style={subMaxWidth ? { maxWidth: subMaxWidth } : undefined}>
          {subtitle}
        </p>
      )}
    </>
  )
}

export default SectionHeading
