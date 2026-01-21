import { Calendar, TrendingUp } from "lucide-react"

function CampaignCard({ campaign, variant = "featured" }) {
  const progressPercentage = Math.min((campaign.currentAmount / campaign.goal) * 100, 100)
  const daysLeft = campaign.daysLeft || Math.floor(Math.random() * 30) + 1

  if (variant === "spotlight") {
    return (
      <a
        href={`/campaign/${campaign.id}`}
        className="flex gap-3 p-3 bg-white rounded-lg border border-border hover:shadow-md hover:border-primary/30 transition-all group"
      >
        <img
          src={campaign.imageUrl || "/crowdfunding-campaign.jpg"}
          alt={campaign.title}
          className="w-20 h-20 object-cover rounded-md flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {campaign.status || "CAMPAIGN START"}
          </p>
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {campaign.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {new Date(campaign.createdAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      </a>
    )
  }

  return (
    <a
      href={`/campaign/${campaign.id}`}
      className="group block bg-white rounded-xl overflow-hidden border border-border hover:shadow-xl hover:border-primary/30 transition-all"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={campaign.imageUrl || "/crowdfunding-campaign.jpg"}
          alt={campaign.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {campaign.category && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-medium text-foreground">
            {campaign.category}
          </span>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-start gap-2 mb-3">
          {campaign.creator?.avatar && (
            <img
              src={campaign.creator.avatar || "/placeholder.svg"}
              alt={campaign.creator.name}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary font-medium uppercase tracking-wide">
              {campaign.status || "Crowdfunding"}
            </p>
            {campaign.creator?.name && <p className="text-xs text-muted-foreground">por {campaign.creator.name}</p>}
          </div>
        </div>

        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2 text-balance">
          {campaign.title}
        </h3>

        {campaign.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 text-pretty">{campaign.description}</p>
        )}

        <div className="space-y-3">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-bold text-foreground text-lg">${campaign.currentAmount?.toLocaleString() || "0"}</p>
              <p className="text-xs text-muted-foreground">de ${campaign.goal?.toLocaleString() || "0"} meta</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4 text-primary" />
                {daysLeft} días
              </p>
              <p className="text-xs text-muted-foreground">restantes</p>
            </div>
          </div>

          {campaign.backers && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
              <TrendingUp className="w-4 h-4" />
              <span>{campaign.backers} patrocinadores</span>
              <span>•</span>
              <span>{progressPercentage.toFixed(0)}% financiado</span>
            </div>
          )}
        </div>
      </div>
    </a>
  )
}

export default CampaignCard
