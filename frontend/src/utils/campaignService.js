const API_URL = import.meta.env.VITE_API_URL || ""

// Mock data para cuando no hay backend configurado
const MOCK_CAMPAIGNS = [
  {
    id: 1,
    title: "SmartDesk Pro: Escritorio inteligente con carga inalámbrica",
    description:
      "Un escritorio moderno que combina diseño minimalista con tecnología de vanguardia para tu espacio de trabajo.",
    goal: 50000,
    currentAmount: 42350,
    imageUrl: "/modern-smart-desk-with-wireless-charging.jpg",
    category: "Technology",
    status: "CROWDFUNDING",
    createdAt: new Date().toISOString(),
    backers: 387,
    creator: {
      name: "TechDesign Studio",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=tech",
    },
  },
  {
    id: 2,
    title: "AquaPure: Purificador de agua portátil para aventureros",
    description: "Mantente hidratado en cualquier lugar con nuestra botella purificadora de última generación.",
    goal: 25000,
    currentAmount: 18750,
    imageUrl: "/portable-water-purifier-bottle.jpg",
    category: "Technology",
    status: "PLEDGE MANAGER",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    backers: 256,
    creator: {
      name: "EcoTech Solutions",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=eco",
    },
  },
  {
    id: 3,
    title: "Cuentos de la Patagonia: Libro ilustrado de naturaleza",
    description: "Una colección de historias y arte inspirado en los paisajes más hermosos de Sudamérica.",
    goal: 15000,
    currentAmount: 12300,
    imageUrl: "/illustrated-book-patagonia.jpg",
    category: "Creative Works",
    status: "CROWDFUNDING",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    backers: 189,
    creator: {
      name: "María González",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
    },
  },
  {
    id: 4,
    title: "MindfulApp: Tu compañero diario de meditación y bienestar",
    description: "Descubre la paz interior con sesiones guiadas personalizadas y seguimiento de progreso.",
    goal: 30000,
    currentAmount: 27800,
    imageUrl: "/meditation-app-interface.png",
    category: "Community Projects",
    status: "CROWDFUNDING",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    backers: 524,
    creator: {
      name: "Wellness Collective",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=wellness",
    },
  },
  {
    id: 5,
    title: "Energía Solar Comunitaria: Documental",
    description: "Un viaje visual por comunidades que transformaron su futuro con energía renovable.",
    goal: 20000,
    currentAmount: 8500,
    imageUrl: "/solar-energy-documentary.jpg",
    category: "Social Impact",
    status: "CAMPAIGN START",
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    backers: 92,
    creator: {
      name: "Green Stories",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=green",
    },
  },
  {
    id: 6,
    title: "Nebula Quest: Juego indie de exploración espacial",
    description: "Explora galaxias desconocidas en este juego de aventura con gráficos retro y historia inmersiva.",
    goal: 45000,
    currentAmount: 38200,
    imageUrl: "/indie-space-game.jpg",
    category: "Gaming Culture",
    status: "CROWDFUNDING",
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    backers: 612,
    creator: {
      name: "Pixel Dreams Studio",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=pixel",
    },
  },
]

function normalizeCampaign(campaign) {
  return {
    ...campaign,
    imageUrl: (() => {
      const primary = campaign.media?.find(m => m.isPrimary) || campaign.media?.[0]
      if (primary?.base64Data) return `data:image/jpeg;base64,${primary.base64Data}`
      if (primary?.url) return primary.url
      return campaign.imageUrl || "/crowdfunding-campaign.jpg"
    })(),
    goal: campaign.targetAmount || campaign.goal || 0,
    category: campaign.category?.name || campaign.category || "General",
    daysLeft: campaign.endDate 
              ? Math.max(0, Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
              : 30,
  }
}

export const campaignService = {
  async getAllCampaigns() {
    if (!API_URL) {
      console.log("[v0] Using mock data - no API_URL configured")
      return MOCK_CAMPAIGNS
    }

    try {
      const response = await fetch(`${API_URL}/api/campaigns`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data.map(normalizeCampaign)
    } catch (error) {
      console.error("[v0] Error fetching campaigns, falling back to mock data:", error)
      return MOCK_CAMPAIGNS
    }
  },

  async getFeaturedCampaigns(limit = 4) {
    const campaigns = await this.getAllCampaigns()
    return campaigns.filter((c) => c.status === "CROWDFUNDING").slice(0, limit)
  },
  
  async getRecentCampaigns(limit = 6) {
    const campaigns = await this.getAllCampaigns()
    return campaigns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit)
  },

  async getCampaignById(id) {
    const campaigns = await this.getAllCampaigns()
    return campaigns.find((c) => c.id === Number.parseInt(id))
  },
}
