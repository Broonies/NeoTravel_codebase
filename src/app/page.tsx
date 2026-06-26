import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">

        <div className="mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-900 text-2xl font-bold mx-auto mb-6 shadow-2xl">
            N
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">NeoTravel</h1>
          <p className="text-slate-400 mt-2 text-sm">Location d&apos;autocars · Devis instantané</p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <Link
            href="/chat"
            className="flex items-center gap-4 bg-white text-slate-900 rounded-2xl px-5 py-4 hover:bg-slate-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 group"
          >
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:bg-slate-200 transition-colors">
              🚌
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">Assistant IA</div>
              <div className="text-xs text-slate-500 mt-0.5">Décrivez votre trajet, je calcule le devis</div>
            </div>
            <svg className="ml-auto w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/devis"
            className="flex items-center gap-4 text-white rounded-2xl px-5 py-4 hover:bg-white/10 transition-all border border-white/10 group"
          >
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl shrink-0">
              📋
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">Formulaire de devis</div>
              <div className="text-xs text-slate-400 mt-0.5">Saisie manuelle · calcul déterministe</div>
            </div>
            <svg className="ml-auto w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="mt-12 flex gap-10">
          {[
            { value: '500+', label: 'Trajets/mois' },
            { value: '98%', label: 'Satisfaction' },
            { value: '< 2s', label: 'Devis instantané' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-center py-4 text-xs text-slate-600">
        © 2025 NeoTravel · Tous droits réservés
      </footer>
    </main>
  )
}
