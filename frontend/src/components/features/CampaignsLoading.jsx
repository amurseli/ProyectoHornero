function CampaignsLoading({ count = 4, variant = "featured" }) {
  if (variant === "spotlight") {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-3 p-3 bg-white rounded-lg border border-border animate-pulse">
            <div className="w-20 h-20 bg-muted rounded-md flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl overflow-hidden border border-border animate-pulse">
          <div className="aspect-video bg-muted" />
          <div className="p-6 space-y-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-5/6" />
            <div className="h-2 bg-muted rounded w-full" />
            <div className="flex justify-between">
              <div className="h-6 bg-muted rounded w-24" />
              <div className="h-6 bg-muted rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default CampaignsLoading
