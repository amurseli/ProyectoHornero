import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Campaigns.css'
import api from '../../api'

function MyCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/campaigns')
      .then((data) => {
        // 🔹 Filtro temporal por usuario 1 (hasta que tengamos login real)
        const myCampaigns = data.filter(c => c.idOwner === 1)
        setCampaigns(myCampaigns)
      })
      .catch((err) => {
        console.error('Error fetching campaigns:', err)
        setError('No se pudieron cargar las campañas')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Cargando campañas...</p>
  if (error) return <p className="error">{error}</p>

  return (
    <main className="campaigns-page">
      <h2>Mis Campañas</h2>

      {campaigns.length === 0 ? (
        <p>No tenés campañas aún.</p>
      ) : (
        <ul className="campaign-list">
          {campaigns.map((c) => (
            <li key={c.id} className="campaign-card">
              <h3>{c.title}</h3>
              <p>{c.shortDescription}</p>
              <button onClick={() => navigate(`/my-campaigns/edit/${c.id}`)}>
                Editar
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        className="floating-btn"
        onClick={() => navigate('/my-campaigns/new')}
      >
        ＋
      </button>
    </main>
  )
}

export default MyCampaigns
