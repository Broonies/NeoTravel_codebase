import Link from 'next/link'

const FEATURES = [
  { icon: '⚡', title: 'Calcul instantané',   desc: 'Devis généré en quelques secondes, sans attendre un commercial.' },
  { icon: '📊', title: 'Prix déterministe',   desc: 'Saisonnalité, capacité, délai, péages — tout est calculé automatiquement.' },
  { icon: '📄', title: 'Devis PDF',           desc: 'Téléchargez un devis professionnel en un clic, prêt à envoyer.' },
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
    <div className="min-h-screen flex flex-col" style={{ background: '#080808' }}>

      {/* Nav */}
      <nav className="px-8 py-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-black font-bold text-sm" style={{ background: '#c8ff00' }}>N</div>
          <span className="text-white font-bold text-lg font-display">NeoTravel</span>
          <span className="text-white/20 text-xs uppercase tracking-widest ml-1 font-display">B2B</span>
        </div>
        <Link
          href="/chat"
          className="text-black text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-90"
          style={{ background: '#c8ff00' }}
        >
          Accéder à l&apos;assistant
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 relative flex flex-col items-center justify-center px-6 text-center py-24 min-h-[900px] overflow-hidden">

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
              className={`animate-float bg-white rounded-2xl overflow-hidden shadow-2xl ${CARD_SIZES[dest.size]}`}
              style={{ animationDelay: `${dest.delay}s`, animationDuration: `${dest.duration}s` }}
            >
              <img src={dest.img} alt={dest.city} className={`w-full ${IMG_SIZES[dest.size]} object-cover`} />
              <div className="px-3 py-2">
                <p className="text-xs font-bold text-slate-800 truncate">{dest.city}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{dest.country}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Contenu hero */}
        <div className="relative z-10 flex flex-col items-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 border text-xs font-medium px-4 py-1.5 rounded-full mb-8 font-display" style={{ borderColor: '#c8ff00', color: '#c8ff00', background: 'rgba(200,255,0,0.06)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#c8ff00' }} />
            Powered by NeoTravel AI v2.1
          </div>

          {/* Titre */}
          <h1 className="font-display text-5xl font-bold text-white leading-tight max-w-2xl">
            Votre devis autocar{' '}
            <span style={{ color: '#c8ff00' }}>en quelques secondes</span>
          </h1>

          <p className="text-white/50 text-lg mt-6 max-w-xl leading-relaxed">
            Décrivez simplement votre trajet à notre assistant IA. Il calcule instantanément
            votre devis, distance, saisonnalité, péages inclus.
          </p>

          {/* CTA */}
          <div className="mt-10">
            <Link
              href="/chat"
              className="inline-flex items-center gap-3 text-black font-bold px-10 py-5 rounded-2xl text-lg transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: '#c8ff00' }}
            >
              Démarrer avec l&apos;assistant
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Mockup chat */}
          <div className="mt-16 w-full max-w-2xl rounded-2xl p-4 text-left border" style={{ background: '#111', borderColor: '#1e1e1e' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(200,255,0,0.5)' }} />
              <span className="text-white/20 text-xs ml-2 font-display">NeoTravel AI</span>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-black text-[10px] font-bold shrink-0 mt-0.5 font-display" style={{ background: '#c8ff00' }}>AI</div>
                <div className="rounded-xl rounded-tl-sm px-3 py-2 text-sm text-white/70 max-w-xs" style={{ background: '#1a1a1a' }}>
                  Bonjour ! Décrivez votre trajet et je calcule votre devis instantanément.
                </div>
              </div>
              <div className="flex justify-end">
                <div className="rounded-xl rounded-tr-sm px-3 py-2 text-sm text-white max-w-xs" style={{ background: '#222' }}>
                  Paris → Lyon, 30 passagers, le 15 septembre
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-black text-[10px] font-bold shrink-0 mt-0.5 font-display" style={{ background: '#c8ff00' }}>AI</div>
                <div className="rounded-xl rounded-tl-sm px-3 py-2 text-sm text-white/70 max-w-xs" style={{ background: '#1a1a1a' }}>
                  Devis calculé ✓ —{' '}
                  <span className="font-semibold" style={{ color: '#c8ff00' }}>1 248 € TTC</span>
                  {' '}pour Paris → Lyon, 30 pax, 15 sept.
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-3 gap-4 w-full max-w-2xl">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="rounded-2xl p-5 text-left border" style={{ background: '#111', borderColor: '#1e1e1e' }}>
                <span className="text-2xl">{icon}</span>
                <p className="text-white font-semibold text-sm mt-3 font-display">{title}</p>
                <p className="text-white/40 text-xs mt-1.5 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-5 text-xs border-t font-display" style={{ color: '#ffffff30', borderColor: '#1e1e1e' }}>
        © 2025 NeoTravel · Tous droits réservés
      </footer>
    </div>
  )
}
