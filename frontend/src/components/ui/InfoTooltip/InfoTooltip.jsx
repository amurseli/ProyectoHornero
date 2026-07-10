import { useEffect, useRef, useState } from "react"
import { Info } from "lucide-react"
import "./InfoTooltip.css"

// Ícono "(i)" que al hacer click despliega un popover con texto explicativo.
// Se cierra con click afuera o Escape.
function InfoTooltip({ children, label = "Más información" }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  return (
    <span className="info-tooltip" ref={ref}>
      <button
        type="button"
        className="info-tooltip-trigger"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
      >
        <Info size={14} />
      </button>
      {open && <div className="info-tooltip-popover" role="tooltip">{children}</div>}
    </span>
  )
}

export default InfoTooltip
