import SectionHeading from "../SectionHeading/SectionHeading.jsx"
import "./ThreeColumns.css"

// ─────────────────────────────────────────────────────────────────────────────
//  ThreeColumns — tres columnas de texto simples (poca animación). Heading +
//  columnas (ícono + título + desc). Paleta Hornero, sin gradiente de relleno.
//    <ThreeColumns eyebrow="…" title="…" subtitle="…" columns={[{icon,title,desc}]} />
// ─────────────────────────────────────────────────────────────────────────────

function ThreeColumns({ eyebrow, title, subtitle, columns = [] }) {
  return (
    <section className="tc">
      {(eyebrow || title || subtitle) && (
        <div className="tc-intro">
          <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} subMaxWidth="44ch" />
        </div>
      )}

      <div className="tc-grid">
        {columns.map(({ icon: Icon, title: t, desc }, i) => (
          <div className="tc-col" key={i}>
            <div className="tc-col-head">
              {Icon && (
                <span className="tc-col-icon">
                  <Icon size={20} strokeWidth={1.9} />
                </span>
              )}
              <span className="tc-col-num">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="tc-col-title">{t}</h3>
            <p className="tc-col-desc">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ThreeColumns
