import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './Campaigns.css'
import api from '$utils/api/api'

function CampaignForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState({
    title: '',
    description: '',
    shortDescription: '',
    idOwner: 1,
    idType: null,
    idCategory: null,
  })

  useEffect(() => {
    if (id) {
      api.get(`/api/campaigns/${id}`)
        .then((data) => setCampaign(data))
        .catch((err) => console.error('Error al cargar la campaña:', err))
    }
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setCampaign((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (id) {
        await api.put(`/api/campaigns/${id}`, campaign)
      } else {
        await api.post('/api/campaigns', campaign)
      }
      navigate('/my-campaigns')
    } catch (err) {
      console.error('Error al guardar la campaña:', err)
      alert('Hubo un error al guardar la campaña.')
    }
  }

  return (
    <main className="campaign-form-page">
      <h2>{id ? 'Editar Campaña' : 'Crear Nueva Campaña'}</h2>

      <form className="campaign-form" onSubmit={handleSubmit}>
        <label>
          Título
          <input
            name="title"
            value={campaign.title}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Descripción corta
          <input
            name="shortDescription"
            value={campaign.shortDescription}
            onChange={handleChange}
          />
        </label>

        <label>
          Descripción completa
          <textarea
            name="description"
            value={campaign.description}
            onChange={handleChange}
          />
        </label>

        <button type="submit">
          {id ? 'Guardar Cambios' : 'Crear Campaña'}
        </button>
      </form>
    </main>
  )
}

export default CampaignForm
