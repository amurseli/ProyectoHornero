import { SA_VIEWBOX, SA_COUNTRIES } from './southAmericaPaths'
import './SouthAmericaMap.css'

/**
 * Geographically accurate South-America map for the campaign creation wizard.
 *
 * Country outlines come from the public-domain svg-maps "world" dataset
 * (MIT), cropped to the continent's bounding box.  Only the codes listed in
 * `enabledCodes` (default: ['AR']) are interactive — they highlight on hover
 * and trigger `onSelect({ code, name })` on click.  The country matching
 * `selectedCode` is rendered with the "selected" fill + glow.
 */
export default function SouthAmericaMap({
  selectedCode = '',
  enabledCodes = ['AR'],
  onSelect = () => {},
}) {
  const isEnabled = (code) => enabledCodes.includes(code)

  return (
    <div className="sam-wrap">
      <div className="sam-board">
        <svg
          className="sam-svg"
          viewBox={SA_VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Mapa de Sudamérica"
        >
          {SA_COUNTRIES.map(c => {
            const enabled  = isEnabled(c.code)
            const selected = selectedCode === c.code
            const classes = [
              'sam-country',
              enabled  ? 'sam-country--enabled'  : 'sam-country--disabled',
              selected ? 'sam-country--selected' : '',
            ].filter(Boolean).join(' ')

            return (
              <path
                key={c.code}
                d={c.d}
                className={classes}
                onClick={() => enabled && onSelect(c)}
                tabIndex={enabled ? 0 : -1}
                onKeyDown={(e) => {
                  if (!enabled) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(c)
                  }
                }}
              >
                <title>{c.name}{enabled ? '' : ' — próximamente'}</title>
              </path>
            )
          })}
        </svg>
      </div>

      <p className="sam-caption">
        Hacé clic en <strong>Argentina</strong> para seleccionarla.
        Los demás países estarán disponibles próximamente.
      </p>
    </div>
  )
}
