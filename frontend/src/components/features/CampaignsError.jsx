"use client"

import { AlertCircle, RefreshCw } from "lucide-react"

function CampaignsError({ message }) {
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Error al cargar las campañas</h3>
      <p className="text-sm text-muted-foreground mb-6">{message || "Hubo un problema al conectar con el servidor"}</p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Intentar de nuevo
      </button>
    </div>
  )
}

export default CampaignsError
