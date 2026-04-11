import { Github, Twitter, Instagram, Linkedin, Heart } from 'lucide-react'

const COLUMNS = [
  {
    title: 'Plataforma',
    links: [
      { label: 'Explorar campañas', href: '/campaigns' },
      { label: 'Crear campaña', href: '/campaigns/new' },
      { label: 'Cómo funciona', href: '/how-it-works' },
      { label: 'Transparencia blockchain', href: '/blockchain' },
    ]
  },
  {
    title: 'Soporte',
    links: [
      { label: 'Centro de ayuda', href: '/help' },
      { label: 'Contacto', href: '/contact' },
      { label: 'Acerca de Hornero', href: '/about' },
    ]
  },
  {
    title: 'Legal',
    links: [
      { label: 'Términos y condiciones', href: '/terms' },
      { label: 'Política de privacidad', href: '/privacy' },
      { label: 'Cookies', href: '/cookies' },
    ]
  },
]

const SOCIALS = [
  { icon: Twitter,   href: 'https://twitter.com',   label: 'Twitter'   },
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: Linkedin,  href: 'https://linkedin.com',  label: 'LinkedIn'  },
  { icon: Github,    href: 'https://github.com',    label: 'GitHub'    },
]

function Footer() {
  return (
    <footer className="hornero-footer">
      <div className="footer-inner">

        {/* Brand */}
        <div className="footer-brand">
          <a href="/" className="footer-logo">Hornero</a>
          <p className="footer-tagline">
            La plataforma de crowdfunding con transparencia blockchain para que tus proyectos arranquen vuelo.
          </p>
          <div className="footer-socials">
            {SOCIALS.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                className="footer-social-btn" aria-label={label}>
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Columns */}
        {COLUMNS.map(col => (
          <div key={col.title} className="footer-col">
            <h4 className="footer-col-title">{col.title}</h4>
            <ul className="footer-col-links">
              {col.links.map(link => (
                <li key={link.label}>
                  <a href={link.href} className="footer-link">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}

      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Proyecto Hornero · FIUBA</span>
        <span className="footer-made">Viaje antes que Destino - Hecho con <Heart size={12} className="footer-heart" /> en Argentina</span>
      </div>

      <style>{`
        .hornero-footer {
          background: var(--color-text-primary);
          color: rgba(255, 255, 255, 0.7);
          padding: 4rem 2rem 0;
          margin-top: auto;
        }

        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 3rem;
          padding-bottom: 3rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-logo {
          font-size: var(--font-size-2xl);
          font-weight: 800;
          background: var(--gradient-warm);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-decoration: none;
          display: inline-block;
          margin-bottom: 0.75rem;
        }

        .footer-tagline {
          font-size: var(--font-size-sm);
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 1.5rem;
          max-width: 280px;
        }

        .footer-socials {
          display: flex;
          gap: 0.5rem;
        }

        .footer-social-btn {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all var(--transition-fast);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .footer-social-btn:hover {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .footer-col-title {
          font-size: var(--font-size-sm);
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 1.25rem;
        }

        .footer-col-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .footer-link {
          font-size: var(--font-size-sm);
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .footer-link:hover {
          color: white;
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--font-size-xs);
          color: rgba(255, 255, 255, 0.35);
        }

        .footer-made {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .footer-heart {
          color: var(--color-primary);
        }

        @media (max-width: 768px) {
          .footer-inner {
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
          }
          .footer-brand {
            grid-column: 1 / -1;
          }
          .footer-bottom {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .footer-inner {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  )
}

export default Footer