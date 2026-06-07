import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MessageSquare, Reply, Send } from 'lucide-react'
import { Button } from '$components/ui'
import api from '$utils/api/api'
import { savePostLoginRedirect } from '$utils/auth/postLoginRedirect'
import { parseBackendInstant } from '$utils/datetime'
import { useUser } from '$store/useUser'
import './CampaignCommentsSection.css'

const MAX_COMMENT_LENGTH = 500

function formatRelativeTime(value) {
  if (!value) return ''

  const date = parseBackendInstant(value)
  if (!date) return ''

  const diffMs = date.getTime() - Date.now()
  const diffSeconds = Math.round(diffMs / 1000)
  const absSeconds = Math.abs(diffSeconds)
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

  if (absSeconds < 60) return rtf.format(diffSeconds, 'second')

  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute')

  const diffHours = Math.round(diffSeconds / 3600)
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour')

  const diffDays = Math.round(diffSeconds / 86400)
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day')

  const diffMonths = Math.round(diffSeconds / 2592000)
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, 'month')

  const diffYears = Math.round(diffSeconds / 31536000)
  return rtf.format(diffYears, 'year')
}

function getInitial(text) {
  const normalized = String(text || '').trim()
  return normalized ? normalized[0].toUpperCase() : '?'
}

function CommentComposer({
  value,
  onChange,
  onSubmit,
  loading,
  placeholder,
  submitLabel,
  onCancel = null,
  disabled = false,
  compact = false,
}) {
  const remaining = MAX_COMMENT_LENGTH - value.length

  return (
    <div className={`cc-composer ${compact ? 'cc-composer--compact' : ''}`}>
      <textarea
        className="cc-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, MAX_COMMENT_LENGTH))}
        maxLength={MAX_COMMENT_LENGTH}
        rows={compact ? 3 : 4}
        placeholder={placeholder}
        disabled={disabled || loading}
      />
      <div className="cc-composer-footer">
        <span className={`cc-counter ${remaining < 60 ? 'cc-counter--warn' : ''}`}>
          {remaining} caracteres disponibles
        </span>
        <div className="cc-actions">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onSubmit}
            disabled={disabled || loading || !value.trim()}
          >
            <Send size={14} />
            {loading ? 'Enviando...' : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CommentItem({
  comment,
  depth,
  replyingToId,
  replyDraft,
  onReplyDraftChange,
  onReplyToggle,
  onReplySubmit,
  replyLoading,
  canReply,
  onRequireLogin,
}) {
  const isReplying = replyingToId === comment.id
  const authorName = comment.author?.userName || 'Usuario'
  const avatarUrl = comment.author?.avatarUrl || ''
  const replies = Array.isArray(comment.replies) ? comment.replies : []
  const isNested = depth > 0
  const threadRootId = comment.parentCommentId ?? comment.id

  return (
    <article className={`cc-item ${isNested ? 'cc-item--nested' : ''}`}>
      <div className="cc-avatar-wrap">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="cc-avatar" />
        ) : (
          <div className="cc-avatar cc-avatar--placeholder">{getInitial(authorName)}</div>
        )}
      </div>

      <div className="cc-bubble">
        <header className="cc-header">
          <div className="cc-author-row">
            <span className="cc-author">{authorName}</span>
            {comment.creatorReply && <span className="cc-creator-tag">Creador</span>}
          </div>
          <span className="cc-time">{formatRelativeTime(comment.createdAt)}</span>
        </header>

        <p className="cc-content">{comment.content}</p>

        {!isNested && (
          <div className="cc-item-actions">
            <button
              type="button"
              className="cc-reply-btn"
              onClick={() => {
                if (!canReply) {
                  onRequireLogin()
                  return
                }
                onReplyToggle(isReplying ? null : comment.id)
              }}
            >
              <Reply size={14} />
              Responder
            </button>
          </div>
        )}

        {isReplying && (
          <CommentComposer
            value={replyDraft}
            onChange={onReplyDraftChange}
            onSubmit={() => onReplySubmit(threadRootId)}
            onCancel={() => onReplyToggle(null)}
            loading={replyLoading}
            placeholder="Responder en el hilo"
            submitLabel="Responder"
            compact
          />
        )}

        {replies.length > 0 && (
          <div className="cc-replies">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                replyingToId={replyingToId}
                replyDraft={replyDraft}
                onReplyDraftChange={onReplyDraftChange}
                onReplyToggle={onReplyToggle}
                onReplySubmit={onReplySubmit}
                replyLoading={replyLoading}
                canReply={canReply}
                onRequireLogin={onRequireLogin}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

export default function CampaignCommentsSection({ campaignId, comments, onCommentsChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()
  const [draft, setDraft] = useState('')
  const [replyDraft, setReplyDraft] = useState('')
  const [replyingToId, setReplyingToId] = useState(null)
  const [postingRoot, setPostingRoot] = useState(false)
  const [postingReply, setPostingReply] = useState(false)
  const [error, setError] = useState('')

  const orderedComments = useMemo(
    () => (Array.isArray(comments) ? comments : []),
    [comments]
  )

  async function reloadComments() {
    const refreshed = await api.get(`/api/campaigns/${campaignId}/comments`)
    onCommentsChange(Array.isArray(refreshed) ? refreshed : [])
  }

  function requireLogin() {
    savePostLoginRedirect(`${location.pathname}${location.search || ''}`)
    navigate('/login')
  }

  async function submitComment(parentCommentId = null) {
    if (!user) {
      requireLogin()
      return
    }

    const content = (parentCommentId ? replyDraft : draft).trim()
    if (!content) return

    setError('')
    if (parentCommentId) setPostingReply(true)
    else setPostingRoot(true)

    try {
      await api.post(`/api/campaigns/${campaignId}/comments`, { content, parentCommentId })
      await reloadComments()
      if (parentCommentId) {
        setReplyDraft('')
        setReplyingToId(null)
      } else {
        setDraft('')
      }
    } catch (submitError) {
      setError(submitError.message || 'No se pudo publicar el comentario')
    } finally {
      if (parentCommentId) setPostingReply(false)
      else setPostingRoot(false)
    }
  }

  return (
    <div className="cp-content-grid">
      <div className="cp-main cp-main--full">
        <div className="cc-header-block">
          <div>
            <h2>Comentarios</h2>
            <p className="cc-subtitle">
              Hacé una pregunta, dejá feedback o seguí la conversación del proyecto.
            </p>
          </div>
          <div className="cc-count">
            <MessageSquare size={16} />
            {orderedComments.length} {orderedComments.length === 1 ? 'hilo' : 'hilos'}
          </div>
        </div>

        {!user && (
          <div className="cc-login-banner">
            <span>Iniciá sesión para comentar o responder dentro del hilo.</span>
            <Button type="button" variant="secondary" size="sm" onClick={requireLogin}>
              Iniciar sesión
            </Button>
          </div>
        )}

        <CommentComposer
          value={draft}
          onChange={setDraft}
          onSubmit={() => submitComment(null)}
          loading={postingRoot}
          placeholder="Escribí tu comentario sobre esta campaña"
          submitLabel="Publicar comentario"
          disabled={!user}
        />

        {error && <p className="cc-error">{error}</p>}

        {orderedComments.length === 0 ? (
          <div className="cc-empty">
            <MessageSquare size={18} />
            <span>Todavía no hay comentarios. Abrí la conversación.</span>
          </div>
        ) : (
          <div className="cc-list">
            {orderedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                depth={0}
                replyingToId={replyingToId}
                replyDraft={replyDraft}
                onReplyDraftChange={setReplyDraft}
                onReplyToggle={setReplyingToId}
                onReplySubmit={submitComment}
                replyLoading={postingReply}
                canReply={!!user}
                onRequireLogin={requireLogin}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
