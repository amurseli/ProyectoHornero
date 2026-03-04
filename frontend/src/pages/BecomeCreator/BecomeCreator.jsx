import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Rocket } from 'lucide-react'
import { useUser } from '../../store/useUser'
import { Button } from '../../components/ui'
import api from '../../utils/api/api'
import './BecomeCreator.css'

function BecomeCreator() {
  const navigate = useNavigate()
  const { refreshUser } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleBecomeCreator = async () => {
    setError(null)
    setLoading(true)

    try {
      await api.post('/api/users/me/become-creator')
      if (refreshUser) await refreshUser()
      navigate('/my-campaigns')
    } catch (err) {
      setError(err.message || 'Error al convertirse en creador.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="become-creator-page">
      <div className="become-creator-card">
        <div className="become-creator-icon">
          <Rocket size={40} />
        </div>
        <h1>Convertite en Creador</h1>
        <p>
          Como creador vas a poder publicar y gestionar tus propias campañas de crowdfunding en Hornero.
        </p>

        {error && (
          <div className="become-creator-error">{error}</div>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={handleBecomeCreator}
          disabled={loading}
        >
          {loading ? 'Procesando...' : 'Concluir'}
        </Button>
      </div>
    </div>
  )
}

export default BecomeCreator
