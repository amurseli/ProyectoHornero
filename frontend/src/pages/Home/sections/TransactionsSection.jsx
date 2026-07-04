import { Link } from "react-router-dom"
import { FiLock, FiSearch, FiGlobe } from "react-icons/fi"
import { useFadeInOnScroll } from "../../../hooks/useFadeInOnScroll"
import "./home-sections.css"

function TransactionsSection() {
  const { ref, className } = useFadeInOnScroll()

  return (
    <section ref={ref} className={`blockchain-banner-section ${className}`}>
      <div className="blockchain-banner">
        <div className="blockchain-banner-content">
          <p className="blockchain-banner-kicker">Transparencia total</p>
          <h2 className="blockchain-banner-title">
            Cada aporte queda grabado en la blockchain
          </h2>
          <p className="blockchain-banner-text">
            Todas las transacciones de la comunidad se registran en la cadena
            de bloques. Nadie puede borrarlas ni modificarlas, y cualquier
            persona puede verificarlas cuando quiera.
          </p>

          <ul className="blockchain-banner-features">
            <li>
              <FiSearch className="blockchain-feature-icon" />
              Trazable
            </li>
            <li>
              <FiLock className="blockchain-feature-icon" />
              Inmutable
            </li>
            <li>
              <FiGlobe className="blockchain-feature-icon" />
              Abierta a todos
            </li>
          </ul>

          <Link to="/transactions" className="transactions-cta blockchain-banner-cta">
            Ver aportes de la comunidad
          </Link>
        </div>
      </div>
    </section>
  )
}

export default TransactionsSection
