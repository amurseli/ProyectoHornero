import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './MarkdownContent.css'

function joinClasses(...values) {
  return values.filter(Boolean).join(' ')
}

export default function MarkdownContent({
  content,
  className = '',
  framed = false,
  fullHeight = false,
  emptyText = 'Sin contenido',
}) {
  const normalized = String(content || '').trim()

  return (
    <div
      className={joinClasses(
        'md-content',
        framed && 'md-content--framed',
        fullHeight && 'md-content--full-height',
        className
      )}
    >
      {normalized ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalized}</ReactMarkdown>
      ) : (
        <p className="md-content-empty">{emptyText}</p>
      )}
    </div>
  )
}
