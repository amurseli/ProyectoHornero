import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Campaigns.css'
import api from '../../api'


function MyCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/campaigns')
      .then((res) => res.json())
      .then((data) => setCampaigns(data.filter(c => c.idOwner === 1)))
      .catch((err) => console.error('Error fetching campaigns:', err))
  }, [])

  return (
    <main className="campaigns-page">
      <h2>Mis Campañas</h2>
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
