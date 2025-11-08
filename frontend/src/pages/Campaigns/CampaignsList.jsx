import React, { useState, useEffect } from 'react'
import api from '../../api'
import './Campaigns.css'

function CampaignsList() {
  const [campaigns, setCampaigns] = useState([])
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get('/api/campaigns')
      .then(setCampaigns)
      .catch((err) => {
        console.error('Error al obtener campañas:', err)
        setError(true)
      })
  }, [])

  if (error) return <p className="error-message">No se pudieron cargar las campañas.</p>

  return (
    <main className="campaigns-page">
      <h2>Todas las Campañas</h2>
      {campaigns.length === 0 ? (
        <p>No hay campañas disponibles.</p>
      ) : (
        <ul className="campaign-list">
          {campaigns.map(c => (
            <li key={c.id} className="campaign-card">
              <h3>{c.title}</h3>
              <p>{c.shortDescription || 'Sin descripción corta'}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default CampaignsList

