export const CAMPAIGN_UPDATE_MAX_LENGTH = 8000
export const CAMPAIGN_UPDATE_PUBLIC_PREVIEW_LENGTH = 750

export function getCampaignUpdateMarkdownPreview(markdown, limit = CAMPAIGN_UPDATE_PUBLIC_PREVIEW_LENGTH) {
  const content = String(markdown || '').trim()
  if (!content) return { text: '', truncated: false }
  if (content.length <= limit) return { text: content, truncated: false }
  return { text: `${content.slice(0, limit).trimEnd()}...`, truncated: true }
}

export function stripMarkdown(markdown) {
  return String(markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

export function getCampaignUpdateExcerpt(markdown, limit = CAMPAIGN_UPDATE_PUBLIC_PREVIEW_LENGTH) {
  const text = stripMarkdown(markdown)
  if (!text) return { text: '', truncated: false }
  if (text.length <= limit) return { text, truncated: false }
  return { text: `${text.slice(0, limit).trimEnd()}...`, truncated: true }
}

export function formatCampaignUpdateDate(value) {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
