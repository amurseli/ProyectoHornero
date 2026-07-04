import { useNavigate } from "react-router-dom"
import { Zap, BarChart2, ShieldCheck, Search, Compass, Wallet, Rocket } from "lucide-react"
import {
  LandingHero,
  TwoPaths,
  HeadedSection,
  TrustNetwork,
  ThreeColumns,
  CrossLinkBanner,
  LandingCta,
} from "$components/landing"

const HERO_IMG = "/how-it-works.jpg"

const HUBS = [
  { icon: ShieldCheck, title: "Transparente", desc: "Cada aporte queda escrito en la blockchain de Polygon: un registro público e inmutable que nadie puede editar ni borrar." },
  { icon: Zap,         title: "Sobre Polygon", desc: "Corremos sobre Polygon, una red rápida y de comisiones mínimas. Por eso dejar cada movimiento on-chain cuesta centavos y confirma en segundos." },
  { icon: Search,      title: "Verificable",  desc: "No hace falta confiar en nuestra palabra: podés rastrear vos mismo cada transacción en un explorador público como Polygonscan." },
  { icon: BarChart2,   title: "En vivo",      desc: "La recaudación y el avance de cada campaña salen directo de la cadena, actualizados en tiempo real." },
]

const COLUMNS = [
  { icon: Compass, title: "Elegí tu proyecto", desc: "Explorá campañas de toda la región y encontrá la idea que querés ver hecha realidad." },
  { icon: Wallet,  title: "Aportá en segundos", desc: "Sumate con el monto que quieras usando medios de pago locales." },
  { icon: Rocket,  title: "Formá parte",   desc: "Mirá el progreso en vivo y recibí novedades del creador hasta que alcance su meta." },
]

// ─────────────────────────────────────────────────────────────────────────────
//  HowItWorks — landing para quien apoya (backers)
//  hero → confianza (red interactiva) → apoyar es simple (3 columnas)
//  → banner ¿sos creador? → CTA
// ─────────────────────────────────────────────────────────────────────────────

function HowItWorks() {
  const navigate = useNavigate()

  return (
    <div className="hiw-page">
      <LandingHero
        image={HERO_IMG}
        imagePosition="center 20%"
        heightScale={0.84}
        eyebrow="Cómo funciona"
        title={<>PROYECTO<br />HORNERO</>}
        subtitle="Hornero conecta a creadores con personas que quieren ver sus ideas hechas realidad, con la transparencia de la blockchain en cada paso."
        buttonLabel="Explorar campañas"
        onButton={() => navigate("/explorar")}
      />

      <TwoPaths
        aboutTitle="Qué hacemos"
        about={
          <>
            <p>
              Proyecto Hornero es una plataforma de financiamiento colectivo orientada al ecosistema latinomericano. Nuestro objetivo es conectar creadores con ideas innovadoras pero sin los recursos para hacerlas despegar, con personas que quieren ver esas ideas llevadas a cabo.
            </p>
          </>
        }
        paths={[
          {
            title: "Si querés apoyar",
            desc: "Apoyá la camapaña de tu creador favorito para tener acceso antipicado y recompensas adicionales a su proyecto. Recibí notifiaciones de las actualizaciones y formá parte de la comunidad que crean.\n Si no sabes que o a quién, pero tenés ganas de apoyar, podes explorar campañas nuevas, cerca de finaciarse o muy financiadas y encontrar la que más te guste.",
            linkLabel: "Explorar campañas",
            onLink: () => navigate("/explorar"),
          },
          {
            title: "Si querés crear",
            desc: "¿Tenés una idea y querés hacerla realidad? Creá tu campaña y compartila con la comunidad. Recibí el apoyo de personas que a las que les interesarái recibir el producto uan vez finalizado y comprometerte a entregarlo.",
            linkLabel: "Crear una campaña",
            onLink: () => navigate("/for-creators"),
          },
        ]}
      />

      <HeadedSection
        eyebrow="Por qué Hornero"
        title="Una red en la que confiar"
        subtitle="Apoyar en Hornero es directo, transparente y fácil de seguir. Pasá el mouse por la red para descubrir cómo."
      >
        <TrustNetwork hubs={HUBS} />
      </HeadedSection>

      <ThreeColumns
        eyebrow="¿Qué tenés que hacer?"
        title="Apoyar es simple"
        subtitle="Explorá. Descubrí. Apoyá."
        columns={COLUMNS}
      />

      <CrossLinkBanner
        title="¿Sos creador?"
        desc="Dale vuelo a tu idea y lanzá tu propia campaña en Hornero."
        buttonLabel="Crear una campaña"
        onButton={() => navigate("/for-creators")}
      />

      <LandingCta
        title="¿Listo para empezar?"
        desc="Encontrá un proyecto para apoyar hoy mismo y seguí cada peso en tiempo real."
        buttonLabel="Explorar campañas"
        onButton={() => navigate("/explorar")}
      />
    </div>
  )
}

export default HowItWorks
