import './Home.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '$utils/api/api';

function Home() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all campaigns
    api.get('/api/campaigns')
      .then((data) => {
        // If API returns no campaigns, fallback to mock data for now
        if (!data || (Array.isArray(data) && data.length === 0)) {
          setCampaigns(MOCK_CAMPAIGNS)
        } else {
          setCampaigns(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al obtener campañas:', err);
        // Use mock campaigns when API fails (development fallback)
        setCampaigns(MOCK_CAMPAIGNS)
        setError(null)
        setLoading(false);
      });
  }, []);

  // Group campaigns by category
  const groupByCategory = () => {
    const categories = {
      featured: [],
      technology: [],
      education: [],
      health: [],
      environment: [],
      other: []
    };

    campaigns.forEach((campaign) => {
      // Use idCategory to determine category, fallback to 'other'
      if (campaign.idCategory === 1) {
        categories.technology.push(campaign);
      } else if (campaign.idCategory === 2) {
        categories.education.push(campaign);
      } else if (campaign.idCategory === 3) {
        categories.health.push(campaign);
      } else if (campaign.idCategory === 4) {
        categories.environment.push(campaign);
      } else {
        categories.other.push(campaign);
      }
    });

    // Featured: Take the first 6 campaigns regardless of category
    categories.featured = campaigns.slice(0, 6);

    return categories;
  };

  const categorizedCampaigns = groupByCategory();

  const handleCampaignClick = (campaignId) => {
    navigate(`/campaigns/${campaignId}`);
  };

  const CategoryRow = ({ title, campaigns }) => {
    const containerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const update = () => {
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollWidth > el.clientWidth + el.scrollLeft + 1);
      };

      update();
      el.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      return () => {
        el.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
      };
    }, [campaigns]);

    const scroll = (distance) => {
      const el = containerRef.current;
      if (!el) return;
      el.scrollBy({ left: distance, behavior: 'smooth' });
    };

    if (!campaigns || campaigns.length === 0) return null;

    return (
      <div className="category-row">
        <h2 className="category-title">{title}</h2>
        <div className="campaigns-carousel">
          <button
            className={`carousel-button left ${canScrollLeft ? 'visible' : ''}`}
            aria-hidden={!canScrollLeft}
            aria-label={`Scroll ${title} left`}
            onClick={() => scroll(-420)}
          >
            ‹
          </button>

          <div className="carousel-container" ref={containerRef}>
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="campaign-card"
                onClick={() => handleCampaignClick(campaign.id)}
              >
                <div className="campaign-card-inner">
                  {/* Media */}
                  <div className="campaign-thumbnail">
                    <img
                      src={campaign.imageUrl || 'https://via.placeholder.com/400x225?text=Campaign'}
                      alt={campaign.title}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x225?text=Campaign';
                      }}
                    />
                  </div>
                  
                  {/* Title - always visible */}
                  <h3 className="campaign-title">{campaign.title}</h3>
                  
                  {/* Expanding white background */}
                  <div className="campaign-expanding-bg"></div>
                  
                  {/* Popup content - appears on hover */}
                  <div className="campaign-popup">
                    <p className="campaign-description">
                      {campaign.shortDescription || 'Sin descripción disponible para esta campaña.'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className={`carousel-button right ${canScrollRight ? 'visible' : ''}`}
            aria-hidden={!canScrollRight}
            aria-label={`Scroll ${title} right`}
            onClick={() => scroll(420)}
          >
            ›
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-spinner">Cargando campañas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Bienvenido a Proyecto Hornero</h1>
          <p className="hero-subtitle">
            Descubre proyectos innovadores y apoya causas que te importan
          </p>
        </div>
        <div className="hero-gradient"></div>
      </div>

      {/* Categories */}
      <div className="categories-container">
        <CategoryRow title="Destacados" campaigns={categorizedCampaigns.featured} />
        <CategoryRow title="Tecnología" campaigns={categorizedCampaigns.technology} />
        <CategoryRow title="Educación" campaigns={categorizedCampaigns.education} />
        <CategoryRow title="Salud" campaigns={categorizedCampaigns.health} />
        <CategoryRow title="Medio Ambiente" campaigns={categorizedCampaigns.environment} />
        <CategoryRow title="Otros Proyectos" campaigns={categorizedCampaigns.other} />
      </div>
    </div>
  );
}

export default Home;

// Mock campaigns to populate Home while API or categories are not ready
const MOCK_CAMPAIGNS = [
  {
    id: 101,
    title: 'EcoCharge: Cargadores solares comunitarios',
    shortDescription: 'Instalación de estaciones de carga solar para barrios.',
    description: 'Proyecto para desplegar cargadores solares en espacios públicos.',
    idOwner: 2,
    idCategory: 4,
    imageUrl: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=450&fit=crop'
  },
  {
    id: 102,
    title: 'KidsCode: Talleres de programación para escuelas',
    shortDescription: 'Capacitación en programación para niñas y niños.',
    description: 'Llevamos cursos de programación y robótica a escuelas públicas.',
    idOwner: 3,
    idCategory: 2,
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop'
  },
  {
    id: 103,
    title: 'HealthNet: Telemedicina para áreas rurales',
    shortDescription: 'Conectar médicos con comunidades remotas.',
    description: 'Plataforma de telemedicina y unidades móviles.',
    idOwner: 4,
    idCategory: 3,
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop'
  },
  {
    id: 104,
    title: 'SmartHome Start',
    shortDescription: 'Prototipo de hogar inteligente de bajo costo.',
    description: 'Kit de domótica abierta para familias de bajos recursos.',
    idOwner: 5,
    idCategory: 1,
    imageUrl: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&h=450&fit=crop'
  },
  {
    id: 105,
    title: 'Verde Urbano',
    shortDescription: 'Huertos y arbolado urbano participativo.',
    description: 'Transformación de terrenos baldíos en huertos comunitarios.',
    idOwner: 6,
    idCategory: 4,
    imageUrl: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&h=450&fit=crop'
  },
  {
    id: 106,
    title: 'AprenderMás',
    shortDescription: 'Becas y recursos educativos en línea.',
    description: 'Microbecas para cursos técnicos y capacitaciones.',
    idOwner: 7,
    idCategory: 2,
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=450&fit=crop'
  },
  {
    id: 107,
    title: 'Pulso Salud',
    shortDescription: 'Detección temprana mediante dispositivos wearables.',
    description: 'Integración de wearables con centros locales de salud.',
    idOwner: 8,
    idCategory: 3,
    imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=450&fit=crop'
  },
  {
    id: 108,
    title: 'OpenGadget',
    shortDescription: 'Herramientas abiertas para makers locales.',
    description: 'Taller itinerante y kits para creadores locales.',
    idOwner: 9,
    idCategory: 1,
    imageUrl: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=800&h=450&fit=crop'
  }
]