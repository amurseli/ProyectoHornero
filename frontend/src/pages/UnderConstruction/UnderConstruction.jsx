import { useNavigate } from 'react-router-dom'
import { Button } from '$components/ui'
import { Construction, ArrowLeft } from 'lucide-react'

function UnderConstruction() {
  const navigate = useNavigate()

  return (
    <div className="under-construction">
      <div className="uc-card">
        <div className="uc-icon">
          <Construction size={48} />
        </div>
        <h1 className="uc-title">Página en construcción</h1>
        <p className="uc-text">
          Esta sección estará pronto disponible. Muy pronto la reemplazaremos por una
          página real con todo el contenido. ¡Muchas gracias por tu paciencia!
        </p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft size={16} />
          Volver al inicio
        </Button>
      </div>

      <style>{`
        .under-construction {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
        }

        .uc-card {
          max-width: 480px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }

        .uc-icon {
          width: 5rem;
          height: 5rem;
          border-radius: var(--radius-lg);
          background: var(--gradient-warm);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .uc-title {
          font-size: var(--font-size-2xl);
          font-weight: 800;
          color: var(--color-text-primary);
          margin: 0;
        }

        .uc-text {
          font-size: var(--font-size-base);
          line-height: 1.6;
          color: var(--color-text-secondary);
          margin: 0;
        }
      `}</style>
    </div>
  )
}

export default UnderConstruction
