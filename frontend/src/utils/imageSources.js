export function getMediaImageSrc(media) {
  if (!media) return ''
  if (media.previewUrl) return media.previewUrl
  if (media.imageUrl) return media.imageUrl
  if (media.base64Data) return `data:image/jpeg;base64,${media.base64Data}`
  return media.url || ''
}

export function getEntityImageSrc(entity) {
  if (!entity) return ''
  if (entity.previewUrl) return entity.previewUrl
  if (entity.imageUrl) return entity.imageUrl
  if (entity.imageBase64) return `data:image/jpeg;base64,${entity.imageBase64}`
  return ''
}
