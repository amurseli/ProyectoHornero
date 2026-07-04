import { HeroButton } from "$components/ui"
import "./LandingHero.css"

// ─────────────────────────────────────────────────────────────────────────────
//  LandingHero — hero de landing con imagen a sangre, título Fraunces, scrim +
//  fundido inferior y un HeroButton. Reutilizable (ForCreators, HowItWorks, …).
//    <LandingHero image="/foo.jpg" title={<>Dale vuelo<br/>a tus ideas</>}
//                 subtitle="…" buttonLabel="Crear" onButton={() => nav(...)} />
// ─────────────────────────────────────────────────────────────────────────────

function LandingHero({
  image,
  imagePosition = "center",
  eyebrow,
  title,
  subtitle,
  buttonLabel,
  onButton,
}) {
  return (
    <section className="lh-hero">
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
