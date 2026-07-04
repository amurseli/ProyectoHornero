import { HeroButton } from "$components/ui"
import "./LandingHero.css"

// ─────────────────────────────────────────────────────────────────────────────
//  LandingHero — hero de landing con imagen a sangre, título grande (--font-display), scrim +
//  fundido inferior y un HeroButton. Reutilizable (ForCreators, HowItWorks, …).
//    <LandingHero image="/foo.jpg" title={<>Dale vuelo<br/>a tus ideas</>}
//                 subtitle="…" buttonLabel="Crear" onButton={() => nav(...)} />
//  heightScale (default 1): escala la altura del hero (ej. 0.7 = 30% más bajo).
// ─────────────────────────────────────────────────────────────────────────────

function LandingHero({
  image,
  imagePosition = "center",
  eyebrow,
  title,
  subtitle,
  buttonLabel,
  onButton,
  heightScale = 1,
}) {
  return (
    <section className="lh-hero" style={{ "--lh-scale": heightScale }}>
      <div
        className="lh-hero-img"
        style={{ backgroundImage: `url(${image})`, backgroundPosition: imagePosition }}
      />
      <div className="lh-hero-scrim" />
      <div className="lh-hero-fade" />

      <div className="lh-hero-content">
        {eyebrow && <span className="lh-hero-eyebrow">{eyebrow}</span>}
        <h1 className="lh-hero-title">{title}</h1>
        {subtitle && <p className="lh-hero-sub">{subtitle}</p>}
        {buttonLabel && <HeroButton onClick={onButton}>{buttonLabel}</HeroButton>}
      </div>
    </section>
  )
}

export default LandingHero
