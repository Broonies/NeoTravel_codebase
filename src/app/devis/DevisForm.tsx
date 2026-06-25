'use client'

import { useState, useTransition } from 'react'
import { calculerDevisAction } from './actions'
import type { DevisActionResult } from './actions'

function CoeffLabel({ value }: { value: number }) {
  const pct = (value * 100).toFixed(0)
  const color = value > 0 ? 'text-red-600' : value < 0 ? 'text-green-600' : 'text-gray-400'
  return (
    <span className={color}>
      {value >= 0 ? '+' : ''}{pct} %
    </span>
  )
}

export default function DevisForm() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<DevisActionResult | null>(null)
  const [allerRetour, setAllerRetour] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const dateDepart = fd.get('date_depart') as string
    setResult(null)

    startTransition(async () => {
      const res = await calculerDevisAction({
        ville_depart:  fd.get('ville_depart') as string,
        ville_arrivee: fd.get('ville_arrivee') as string,
        date_depart:   dateDepart,
        // Si aller simple, date_arrivee = date_depart (même journée)
        date_arrivee:  allerRetour ? (fd.get('date_arrivee') as string) : dateDepart,
        nb_passagers:  parseInt(fd.get('nb_passagers') as string, 10),
        aller_retour:  allerRetour,
        guide:         fd.has('guide'),
        commentaire:   (fd.get('commentaire') as string) || undefined,
      })
      setResult(res)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">NeoTravel — Simulateur de devis</h1>
          <p className="text-sm text-gray-500 mt-1">
            Calcul déterministe · distance + péages via HERE Routing API
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville de départ
              </label>
              <input
                name="ville_depart" type="text" required placeholder="Paris"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville d&apos;arrivée
              </label>
              <input
                name="ville_arrivee" type="text" required placeholder="Lyon"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {/* Aller/retour checkbox placé avant les dates pour conditionner l'affichage */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                name="aller_retour"
                type="checkbox"
                className="w-4 h-4 rounded"
                checked={allerRetour}
                onChange={e => setAllerRetour(e.target.checked)}
              />
              Aller / retour
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input name="guide" type="checkbox" className="w-4 h-4 rounded" />
              Guide touristique
            </label>
          </div>

          <div className={`grid gap-4 ${allerRetour ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de départ
              </label>
              <input
                name="date_depart" type="date" required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            {allerRetour && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de retour
                </label>
                <input
                  name="date_arrivee" type="date" required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de passagers
            </label>
            <input
              name="nb_passagers" type="number" min="1" max="85" required placeholder="30"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <p className="text-xs text-gray-400 mt-1">Max 85 — au-delà, escalade commerciale (HITL)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commentaire
            </label>
            <textarea
              name="commentaire"
              rows={3}
              placeholder="Informations complémentaires, exigences particulières…"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            {isPending ? '⏳ Calcul en cours…' : 'Calculer le devis'}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-6">
            {result.ok ? (
              <div className="bg-white rounded-xl border p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Résultat du calcul</h2>

                {/* Route HERE */}
                <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    HERE Routing API
                  </p>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distance</span>
                    <span className="font-medium">{result.km} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Péages autoroute (classe 4)</span>
                    <span className="font-medium">{result.peages} €</span>
                  </div>
                </div>

                {/* Coefficients */}
                <div className="text-sm space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Décomposition du prix
                  </p>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Prix de base</span>
                    <span className="font-medium">{result.devis.prix_base} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Saisonnalité</span>
                    <CoeffLabel value={result.devis.coeff_saisonnalite} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Capacité véhicule</span>
                    <CoeffLabel value={result.devis.coeff_capacite} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Délai de réservation</span>
                    <CoeffLabel value={result.devis.coeff_delai} />
                  </div>
                  {result.supplement_detail.peages > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Péages autoroute</span>
                      <span>+{result.supplement_detail.peages} €</span>
                    </div>
                  )}
                  {result.supplement_detail.nuit_chauffeur > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Nuit chauffeur ({result.supplement_detail.nb_nuits}
                        {result.supplement_detail.nb_nuits > 1 ? ' nuits' : ' nuit'})
                      </span>
                      <span>+{result.supplement_detail.nuit_chauffeur} €</span>
                    </div>
                  )}
                  {result.supplement_detail.guide > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Guide ({result.supplement_detail.nb_jours}
                        {result.supplement_detail.nb_jours > 1 ? ' jours' : ' jour'})
                      </span>
                      <span>+{result.supplement_detail.guide} €</span>
                    </div>
                  )}
                </div>

                {/* Totaux */}
                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Montant HT</span>
                    <span>{result.devis.montant_ht} €</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>TVA (10 %)</span>
                    <span>{result.devis.montant_tva} €</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t pt-2">
                    <span>Total TTC</span>
                    <span>{result.devis.montant_ttc} €</span>
                  </div>
                  <p className="text-xs text-gray-400 text-right">
                    Mode : {result.devis.mode_generation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <p className="font-medium mb-1">Erreur</p>
                <p>{result.error}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
