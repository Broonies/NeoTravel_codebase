import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getDossierComplet, updateDevisStatut } from '../../actions'

const URGENCE_LABELS: Record<string, string> = {
  DD_PRIORITAIRE: '🔴 Prioritaire (< 48h)',
  DD_URGENT:      '🟠 Urgent (2–7 jours)',
  DD_NORMAL:      '🟢 Normal',
  DD_3MOISETPLUS: '🔵 3 mois et +',
}

const STATUT_LABELS: Record<string, string> = {
  envoye:    '📤 Envoyé',
  relance_1: '🔁 Relance 1',
  relance_2: '🔁 Relance 2',
  accepte:   '✅ Accepté',
  refuse:    '❌ Refusé',
  cloture:   '🔒 Clôturé',
}

const DEMANDE_STATUT_LABELS: Record<string, string> = {
  demande_qualifiee:   'Qualifiée',
  demande_incomplete:  'Incomplète',
  cas_complexe:        'Cas complexe',
  en_attente:          'En attente',
  escalade:            'Escalade humaine',
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value ?? '—'}</span>
    </div>
  )
}

export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dossier = await getDossierComplet(Number(id))
  if (!dossier) notFound()

  const { lead, demande, devis } = dossier

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          ← Dashboard
        </Link>
        <span className="text-gray-300">/</span>
        <p className="font-semibold text-gray-900 text-sm">
          Dossier #{demande.id} — {demande.ville_depart} → {demande.ville_arrivee}
        </p>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {URGENCE_LABELS[demande.urgence_code] ?? demande.urgence_code}
        </span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Lead */}
        <section className="bg-white rounded-xl border p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Contact</h2>
          <Row label="Nom" value={[lead.prenom, lead.nom].filter(Boolean).join(' ') || 'Non renseigné'} />
          <Row label="Email" value={lead.email} />
          <Row label="Téléphone" value={lead.telephone} />
          <Row label="Type" value={lead.type_client} />
          {lead.societe && <Row label="Structure" value={lead.societe} />}
          <Row label="Demande reçue le" value={formatDate(lead.created_at)} />
        </section>

        {/* Demande */}
        <section className="bg-white rounded-xl border p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Demande</h2>
          <Row label="Trajet" value={`${demande.ville_depart} → ${demande.ville_arrivee}`} />
          <Row label="Date de départ" value={formatDate(demande.date_depart)} />
          <Row label="Date de retour" value={demande.aller_retour ? formatDate(demande.date_arrivee) : 'Aller simple'} />
          <Row label="Passagers" value={demande.nb_passagers} />
          <Row label="Statut demande" value={DEMANDE_STATUT_LABELS[demande.type_statut] ?? demande.type_statut} />
          <Row label="Complétude" value={`${Math.round(demande.score_completude * 100)} %`} />
          {demande.commentaire && <Row label="Commentaire" value={demande.commentaire} />}
        </section>

        {/* Devis */}
        <section className="bg-white rounded-xl border p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Devis</h2>
          {devis ? (
            <>
              <Row label="Montant HT"  value={`${devis.montant_ht} €`} />
              <Row label="TVA (10 %)"  value={`${devis.montant_tva} €`} />
              <Row label="Montant TTC" value={`${devis.montant_ttc} €`} />
              <Row label="Statut"      value={STATUT_LABELS[devis.statut] ?? devis.statut} />
              <Row label="Envoyé le"   value={formatDate(devis.date_envoi)} />
              <Row label="Nb relances" value={devis.nb_relance} />
              <Row label="Prochaine relance" value={formatDate(devis.prochaine_relance)} />
              {devis.pdf_url && (
                <div className="mt-4">
                  <a
                    href={devis.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors text-center"
                  >
                    ⬇ Télécharger le PDF
                  </a>
                </div>
              )}
              {!['accepte', 'refuse', 'cloture'].includes(devis.statut) && (
                <div className="mt-4 flex gap-3">
                  <form action={async () => {
                    'use server'
                    await updateDevisStatut(devis!.id, 'accepte')
                    redirect(`/dashboard/dossier/${demande.id}`)
                  }}>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
                      style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}
                    >
                      ✅ Marquer Accepté
                    </button>
                  </form>
                  <form action={async () => {
                    'use server'
                    await updateDevisStatut(devis!.id, 'refuse')
                    redirect(`/dashboard/dossier/${demande.id}`)
                  }}>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
                      style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                    >
                      ❌ Marquer Refusé
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 py-2">Aucun devis généré pour cette demande.</p>
          )}
        </section>

      </div>
    </div>
  )
}
