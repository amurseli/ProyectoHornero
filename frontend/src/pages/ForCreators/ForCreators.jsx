import { useNavigate } from "react-router-dom"
import { LandingHero, StepsStack, LandingCta } from "$components/landing"
import SuccessStories from "./sections/SuccessStories"

// La foto vive en public/ → se referencia por path raíz
const HERO_IMG = "/for-creators-image.jpg"

const STEPS = [
  {
    title: "Contá tu idea",
    desc: "Seguí el paso a paso creando un título, elgiendo la duración y contando tu historia.",
  },
  {
    title: "Sumá tu contenido multimedia",
    desc: "Fotos y un video para que tu campaña enamore. La portada es lo que engancha a la primera.",
  },
  {
    title: "Publicá y compartí",
    desc: "Revisás y publicás. Tu campaña sale al instante, lista para difundir en tu comunidad.",
  },
  {
    title: "Recibí el apoyo",
    desc: "Los fondos llegan directo y cada movimiento queda en blockchain: podés demostrarles a tus backers que la plata se usó bien.",
  },
]

// ─────────────────────────────────────────────────────────────────────────────
//  ForCreators — landing de creadores
//  hero → historias de éxito → cómo funciona (pasos) → CTA
// ─────────────────────────────────────────────────────────────────────────────

function ForCreators() {
  const navigate = useNavigate()

  return (
    <div className="fc-page">
      <LandingHero
        image={HERO_IMG}
        imagePosition="center 38%"
        title={<>Dale vuelo<br />a tus ideas</>}
        subtitle="Lanzá tu campaña y dejá que la comunidad la haga despegar. Crowdfunding con transparencia real, de principio a fin."
        buttonLabel="Crear mi campaña"
        onButton={() => navigate("/my-campaigns/new")}
      />

      <SuccessStories />

      <StepsStack eyebrow="Cómo funciona" title="Lanzar es simple" steps={STEPS} />

      <LandingCta
        title="¿Listo para darle vuelo?"
        desc="Crear tu campaña es gratis y toma menos de 10 minutos. Sumate a los creadores que ya despegaron con Hornero."
        buttonLabel="Crear mi campaña"
        onButton={() => navigate("/my-campaigns/new")}
      />
    </div>
  )
}

export default ForCreators
