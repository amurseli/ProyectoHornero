import { AlertCircle } from "lucide-react"

function BackendStatusBanner() {
  const apiUrl = import.meta.env.VITE_API_URL

  if (apiUrl) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-accent/10 to-secondary/10 border-b border-accent/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-foreground mb-1">Mostrando datos de ejemplo</p>
            <p className="text-muted-foreground">
              Para conectar tu backend real, agrega la variable{" "}
              <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">VITE_API_URL</code> en la sección Vars
              del sidebar izquierdo.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BackendStatusBanner
