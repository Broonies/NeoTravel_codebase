import Link from 'next/link'

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Calcul instantané',
    desc: 'Devis généré en quelques secondes — distance, saisonnalité et péages inclus.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Prix déterministe',
    desc: 'Saisonnalité, capacité, délai, péages — chaque paramètre est calculé automatiquement.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Devis PDF',
    desc: 'Téléchargez un devis professionnel en un clic, prêt à envoyer à votre client.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
        <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
      </svg>
    ),
    title: 'Réponse en 24 h',
    desc: 'Un devis clair et rapide, sans engagement de votre part.',
  },
]

const DESTINATIONS = [
  // Gauche col 1
  { city: 'Marseille',         country: 'Provence',           img: 'https://picsum.photos/seed/marseille/280/180',   style: { top: '2%',  left: '1%'  }, rotate: -4, delay: 0,   duration: 3.8, size: 'lg' },
  { city: 'Lyon',              country: 'Auvergne-Rhône',     img: 'https://picsum.photos/seed/lyon/280/180',        style: { top: '26%', left: '-1%' }, rotate: 2,  delay: 0.5, duration: 4.2, size: 'md' },
  { city: 'Toulouse',          country: 'Occitanie',          img: 'https://picsum.photos/seed/toulouse/280/180',    style: { top: '50%', left: '1%'  }, rotate: -2, delay: 1.0, duration: 3.6, size: 'lg' },
  { city: 'Nantes',            country: 'Pays de la Loire',   img: 'https://picsum.photos/seed/nantes/280/180',      style: { top: '74%', left: '-1%' }, rotate: 3,  delay: 1.5, duration: 4.0, size: 'md' },
  // Gauche col 2
  { city: 'Paris',             country: 'Île-de-France',      img: 'https://picsum.photos/seed/paris/280/180',       style: { top: '14%', left: '17%' }, rotate: -1, delay: 0.3, duration: 4.5, size: 'sm' },
  { city: 'Mont-Saint-Michel', country: 'Normandie',          img: 'https://picsum.photos/seed/normandie/280/180',   style: { top: '62%', left: '15%' }, rotate: 2,  delay: 1.2, duration: 3.7, size: 'sm' },
  { city: 'Grenoble',          country: 'Isère',              img: 'https://picsum.photos/seed/grenoble/280/180',    style: { top: '88%', left: '2%'  }, rotate: -3, delay: 1.8, duration: 4.3, size: 'sm' },
  // Droite col 1
  { city: 'Nice',              country: "Côte d'Azur",        img: 'https://picsum.photos/seed/nice/280/180',        style: { top: '1%',  right: '1%' }, rotate: 3,  delay: 0.2, duration: 4.4, size: 'lg' },
  { city: 'Bordeaux',          country: 'Nouvelle-Aquitaine', img: 'https://picsum.photos/seed/bordeaux/280/180',    style: { top: '25%', right: '-1%'}, rotate: -3, delay: 0.7, duration: 3.9, size: 'md' },
  { city: 'Strasbourg',        country: 'Grand Est',          img: 'https://picsum.photos/seed/strasbourg/280/180',  style: { top: '50%', right: '1%' }, rotate: 2,  delay: 1.1, duration: 4.1, size: 'lg' },
  { city: 'Rennes',            country: 'Bretagne',           img: 'https://picsum.photos/seed/rennes/280/180',      style: { top: '75%', right: '-1%'}, rotate: -2, delay: 1.6, duration: 3.5, size: 'md' },
  // Droite col 2
  { city: 'Barcelone',         country: 'Espagne',            img: 'https://picsum.photos/seed/barcelona/280/180',   style: { top: '13%', right: '17%'}, rotate: 4,  delay: 0.4, duration: 4.6, size: 'sm' },
  { city: 'Rome',              country: 'Italie',             img: 'https://picsum.photos/seed/rome/280/180',        style: { top: '40%', right: '14%'}, rotate: -2, delay: 0.9, duration: 3.8, size: 'sm' },
  { city: 'Amsterdam',         country: 'Pays-Bas',           img: 'https://picsum.photos/seed/amsterdam/280/180',   style: { top: '63%', right: '16%'}, rotate: 3,  delay: 1.3, duration: 4.2, size: 'sm' },
  { city: 'Versailles',        country: 'Île-de-France',      img: 'https://picsum.photos/seed/versailles/280/180',  style: { top: '87%', right: '3%' }, rotate: -1, delay: 1.9, duration: 3.6, size: 'sm' },
]

const CARD_SIZES: Record<string, string> = { lg: 'w-40', md: 'w-36', sm: 'w-32' }
const IMG_SIZES:  Record<string, string> = { lg: 'h-24', md: 'h-20', sm: 'h-[72px]' }

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Hero (gradient indigo) ── */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{ background: 'linear-gradient(120deg, #4220ad, #5a2bd9 60%, #6c40e6)', minHeight: '820px' }}
      >
        {/* Halo lime en bas à droite */}
        <div
          className="pointer-events-none absolute"
          style={{
            right: '-80px', bottom: '-120px',
            width: '420px', height: '420px', borderRadius: '50%',
            background: 'radial-gradient(circle, #c8db1a, transparent 62%)',
            opacity: 0.45,
          }}
        />

        {/* Nav */}
        <nav className="relative z-10 px-4 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
              style={{ background: '#c8db1a', color: '#1e1e32', fontFamily: 'Poppins, sans-serif' }}
            >
              N
            </div>
            <div>
              <span className="font-display text-white font-bold text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Neo<span style={{ color: '#c8db1a' }}>Travel</span>
              </span>
              <span
                className="block text-xs"
                style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              >
                Location autocar · devis instantané
              </span>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 transition-all hover:-translate-y-px"
            style={{
              fontFamily: 'Poppins, sans-serif',
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: '999px',
            }}
          >
            Dashboard
          </Link>
        </nav>

        {/* Cartes destinations flottantes */}
        {DESTINATIONS.map((dest) => (
          <div
            key={dest.city}
            className="absolute hidden xl:block animate-pop-in"
            style={{
              ...dest.style,
              transform: `rotate(${dest.rotate}deg)`,
              animationDelay: `${dest.delay}s`,
            }}
          >
            <div
              className={`animate-float bg-white overflow-hidden shadow-2xl ${CARD_SIZES[dest.size]}`}
              style={{
                borderRadius: '18px',
                boxShadow: '0 30px 70px -30px rgba(30,30,50,.45)',
                animationDelay: `${dest.delay}s`,
                animationDuration: `${dest.duration}s`,
              }}
            >
              <img src={dest.img} alt={dest.city} className={`w-full ${IMG_SIZES[dest.size]} object-cover`} />
              <div className="px-3 py-2">
                <p className="text-xs font-bold truncate" style={{ fontFamily: 'Poppins, sans-serif', color: '#1e1e32' }}>{dest.city}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#6e6e82', fontSize: '10px' }}>{dest.country}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20">

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-4 py-2 mb-8"
            style={{
              fontFamily: 'Inter, sans-serif',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '999px',
              color: '#e6f06b',
              letterSpacing: '0.14em',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#c8db1a' }} />
            Powered by NeoTravel AI v2.1
          </div>

          {/* Titre */}
          <h1
            className="text-white font-display leading-tight max-w-2xl"
            style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(30px,5vw,52px)', lineHeight: 1.05 }}
          >
            Établissons votre devis<br />
            <span style={{ color: '#c8db1a' }}>gratuitement et rapidement</span>
          </h1>

          <p
            className="mt-6 max-w-xl leading-relaxed"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '17px', color: 'rgba(255,255,255,0.82)' }}
          >
            Décrivez simplement votre trajet à notre assistant IA. Il calcule instantanément
            votre devis — distance, saisonnalité, péages inclus.
          </p>

          {/* CTA */}
          <div className="mt-10">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2.5 font-semibold px-10 py-5 transition-all hover:-translate-y-px"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: '16px',
                background: '#5a2bd9',
                color: '#fff',
                borderRadius: '999px',
                boxShadow: '0 10px 22px -10px #5a2bd9',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5">
                <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" />
              </svg>
              Démarrer avec l&apos;assistant
            </Link>
          </div>
        </div>
      </div>

      {/* ── Section features (fond clair) ── */}
      <section style={{ background: '#f8f8fc', borderTop: '1px solid #e6e6ee' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

          <div className="text-center mb-12">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ fontFamily: 'Inter, sans-serif', color: '#6e6e82', letterSpacing: '0.14em' }}
            >
              Pourquoi NeoTravel
            </p>
            <h2
              className="font-display"
              style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '30px', color: '#1e1e32' }}
            >
              Tout pour votre devis autocar
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {FEATURES.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white text-left p-6 transition-all hover:-translate-y-1"
                style={{
                  border: '1.5px solid #e6f06b',
                  borderRadius: '22px',
                  boxShadow: '0 18px 40px -18px rgba(30,30,50,.12)',
                }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center mb-4"
                  style={{ background: '#f3eefc', borderRadius: '14px', color: '#5a2bd9' }}
                >
                  {icon}
                </div>
                <h4
                  className="font-display mb-2"
                  style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '15px', color: '#1e1e32' }}
                >
                  {title}
                </h4>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6e6e82' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="text-center py-6 text-sm border-t"
        style={{ fontFamily: 'Inter, sans-serif', color: '#6e6e82', borderColor: '#e6e6ee', background: '#f8f8fc' }}
      >
        © 2025 <strong style={{ color: '#1e1e32' }}>NeoTravel</strong> · Tous droits réservés
      </footer>
    </div>
  )
}
