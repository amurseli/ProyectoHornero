import React, { useEffect, useState } from 'react'
import api from '../../api'
import './Campaigns.css'

function CampaignsList() {
  const [campaigns, setCampaigns] = useState([])

  useEffect(() => {
    api.get('/api/campaigns')
      .then(setCampaigns)
      .catch((err) => console.error('Error al obtener campañas:', err))
  }, [])

  return (
    <main className="campaigns-page">
      <h2>Todas las Campañas</h2>
      <ul className="campaign-list">
        {campaigns.map(c => (
          <li key={c.id} className="campaign-card">
            <h3>{c.title}</h3>
            <p>{c.shortDescription}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default CampaignsList
