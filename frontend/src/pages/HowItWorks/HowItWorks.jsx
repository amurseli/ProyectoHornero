import { useNavigate } from "react-router-dom"
import { HeartHandshake, BarChart2, ShieldCheck, Users, Compass, Wallet, Rocket } from "lucide-react"
import {
  LandingHero,
  TwoPaths,
  HeadedSection,
  TrustNetwork,
  ThreeColumns,
  CrossLinkBanner,
  LandingCta,
} from "$components/landing"

// La foto vive en public/ → se referencia por path raíz
const HERO_IMG = "/how-it-works-image.jpg"

// Hubs de la red interactiva (tono blockchain dosificado: solo 1 lo menciona)
const HUBS = [
  { icon: ShieldCheck,    title: "Transparente", desc: "Cada movimiento de fondos queda registrado y es verificable. Sin cajas negras." },
  { icon: HeartHandshake, title: "Directo",      desc: "Tu aporte llega al creador sin intermediarios que se queden una tajada." },
  { icon: BarChart2,      title: "En vivo",      desc: "Seguí la recaudación y el avance de cada campaña en tiempo real." },
  { icon: Users,          title: "En comunidad", desc: "Miles de personas apoyando ideas creativas de toda la región." },
]

// Tres columnas: qué fácil es apoyar
const COLUMNS = [
  { icon: Compass, title: "Elegí tu proyecto", desc: "Explorá campañas de toda la región y encontrá la idea que querés ver hecha realidad." },
  { icon: Wallet,  title: "Aportá en segundos", desc: "Sumate con el monto que quieras usando medios de pago locales. Sin trámites ni vueltas." },
  { icon: Rocket,  title: "Seguilo despegar",   desc: "Mirá el progreso en vivo y recibí novedades del creador hasta que alcance su meta." },
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
        imagePosition="center"
        eyebrow="Cómo funciona"
        title={<>Apoyar un proyecto<br />nunca fue tan claro</>}
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
            <p>
              {/* TODO: reemplazar por texto real — párrafo 2 (opcional) */}
              Segundo párrafo opcional con más detalle sobre la misión, la
              transparencia y la comunidad. Borralo si con uno alcanza.
            </p>
          </>
        }
        paths={[
          {
            title: "Si querés apoyar",
            desc: "Descubrí proyectos de toda la región y sumate con el aporte que quieras. Seguí cada peso en tiempo real.",
            linkLabel: "Explorar campañas",
            onLink: () => navigate("/explorar"),
          },
          {
            title: "Si querés crear",
            desc: "Convertí tu idea en una campaña, contá tu historia y conseguí el apoyo de una comunidad que quiere verla despegar.",
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
        eyebrow="Apoyar es simple"
        title="En tres pasos y listo"
        subtitle="Del descubrimiento al apoyo, sin vueltas ni trámites."
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
