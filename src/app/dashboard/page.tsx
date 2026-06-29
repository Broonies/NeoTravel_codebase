import Link from 'next/link'
import { getDossiersUrgents } from './actions'

const URGENCE_CONFIG = {
  DD_PRIORITAIRE: { label: '🔴 PRIORITAIRE', bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-100 text-red-700', desc: '< 48h' },
  DD_URGENT:      { label: '🟠 URGENT',      bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', desc: '2–7 jours' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function DashboardPage() {
  const dossiers = await getDossiersUrgents()

  const prioritaires = dossiers.filter(d => d.urgence_code === 'DD_PRIORITAIRE')
  const urgents      = dossiers.filter(d => d.urgence_code === 'DD_URGENT')

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/" className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-gray-800 transition-colors">
          N
        </Link>
        <div>
          <p className="font-semibold text-gray-900 text-sm">Dashboard Sales</p>
          <p className="text-xs text-gray-400">Dossiers urgents · NeoTravel</p>
        </div>
        <span className="ml-auto text-xs text-gray-400">
          {dossiers.length} dossier{dossiers.length > 1 ? 's' : ''} urgent{dossiers.length > 1 ? 's' : ''}
        </span>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {dossiers.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-3xl mb-3">✅</p>
            <p className="font-medium text-gray-600">Aucun dossier urgent</p>
            <p className="text-sm mt-1">Toutes les demandes sont dans les délais normaux.</p>
          </div>
        )}

        {prioritaires.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-red-600 mb-3">
              Prioritaire — départ &lt; 48h
            </h2>
            <div className="space-y-3">
              {prioritaires.map(d => (
                <DossierCard key={d.demande_id} dossier={d} />
              ))}
            </div>
          </section>
        )}

        {urgents.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-orange-600 mb-3">
              Urgent — départ dans 2–7 jours
            </h2>
            <div className="space-y-3">
              {urgents.map(d => (
                <DossierCard key={d.demande_id} dossier={d} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}

function DossierCard({ dossier: d }: { dossier: import('./actions').DossierUrgent }) {
  const cfg = URGENCE_CONFIG[d.urgence_code]
  return (
    <Link
      href={`/dashboard/dossier/${d.demande_id}`}
      className={`block ${cfg.bg} ${cfg.border} border rounded-xl p-4 hover:shadow-sm transition-shadow`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-gray-500">Départ le {formatDate(d.date_depart)}</span>
          </div>
          <p className="font-semibold text-gray-900">
            {d.ville_depart} → {d.ville_arrivee}
          </p>
          <p className="text-sm text-gray-600">
            {d.lead.prenom} {d.lead.nom} · {d.nb_passagers} passagers
          </p>
          <p className="text-xs text-gray-400">{d.lead.email} · {d.lead.telephone}</p>
        </div>
        <span className="text-gray-400 text-lg mt-1">→</span>
      </div>
    </Link>
  )
}
