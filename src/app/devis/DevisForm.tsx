'use client'

import { useState, useTransition } from 'react'
import { calculerDevisAction } from './actions'
import type { DevisActionResult } from './actions'
import Link from 'next/link'

function CoeffLabel({ value }: { value: number }) {
  const pct = (value * 100).toFixed(0)
  const color = value > 0 ? 'text-rose-500' : value < 0 ? 'text-emerald-600' : 'text-slate-400'
  return (
    <span className={color}>
      {value >= 0 ? '+' : ''}{pct} %
    </span>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-3 border-b border-white/10">
        <Link href="/" className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white text-xs font-bold transition-colors shrink-0">
          N
        </Link>
        <div>
          <p className="font-semibold text-white text-sm">NeoTravel</p>
          <p className="text-xs text-slate-400">Formulaire de devis</p>
        </div>
        <Link
          href="/chat"
          className="ml-auto flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Assistant IA
        </Link>
      </header>

      {/* Contenu */}
      <div className="max-w-xl mx-auto px-4 py-10">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Simulateur de devis</h1>
          <p className="text-sm text-slate-400 mt-1">Calcul déterministe · distance + péages via HERE Routing API</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Trajet */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Trajet</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ville de départ">
                  <input name="ville_depart" type="text" required placeholder="Paris" className={inputCls} />
                </Field>
                <Field label="Ville d'arrivée">
                  <input name="ville_arrivee" type="text" required placeholder="Lyon" className={inputCls} />
                </Field>
              </div>
            </div>

            {/* Options */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Options</p>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                  <input
                    name="aller_retour"
                    type="checkbox"
                    className="w-4 h-4 rounded accent-slate-900"
                    checked={allerRetour}
                    onChange={e => setAllerRetour(e.target.checked)}
                  />
                  Aller / retour
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                  <input name="guide" type="checkbox" className="w-4 h-4 rounded accent-slate-900" />
                  Guide touristique
                </label>
              </div>
            </div>

            {/* Dates */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Dates</p>
              <div className={`grid gap-3 ${allerRetour ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <Field label="Date de départ">
                  <input name="date_depart" type="date" required className={inputCls} />
                </Field>
                {allerRetour && (
                  <Field label="Date de retour">
                    <input name="date_arrivee" type="date" required className={inputCls} />
                  </Field>
                )}
              </div>
            </div>

            {/* Passagers */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Passagers</p>
              <Field label="Nombre de passagers" hint="Max 85 — au-delà, escalade commerciale (HITL)">
                <input
                  name="nb_passagers" type="number" min="1" max="85" required placeholder="30"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Commentaire */}
            <Field label="Commentaire (optionnel)">
              <textarea
                name="commentaire"
                rows={3}
                placeholder="Informations complémentaires, exigences particulières…"
                className={`${inputCls} resize-none`}
              />
            </Field>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              {isPending ? '⏳ Calcul en cours…' : 'Calculer le devis'}
            </button>
          </form>
        </div>

        {/* Résultat */}
        {result && (
          <div className="mt-5">
            {result.ok ? (
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* En-tête résultat */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4">
                  <p className="font-semibold text-white">Résultat du calcul</p>
                  <p className="text-xs text-slate-400 mt-0.5">via HERE Routing API</p>
                </div>

                <div className="p-5 space-y-5">
                  {/* Infos trajet */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-400">Distance</p>
                      <p className="font-bold text-slate-800 mt-0.5">{result.km} km</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-400">Péages (classe 4)</p>
                      <p className="font-bold text-slate-800 mt-0.5">{result.peages} €</p>
                    </div>
                  </div>

                  {/* Décomposition */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Décomposition du prix</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Prix de base</span>
                        <span className="font-medium text-slate-800">{result.devis.prix_base} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Saisonnalité</span>
                        <CoeffLabel value={result.devis.coeff_saisonnalite} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Capacité véhicule</span>
                        <CoeffLabel value={result.devis.coeff_capacite} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Délai de réservation</span>
                        <CoeffLabel value={result.devis.coeff_delai} />
                      </div>
                      {result.supplement_detail.peages > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Péages autoroute</span>
                          <span className="text-slate-700">+{result.supplement_detail.peages} €</span>
                        </div>
                      )}
                      {result.supplement_detail.nuit_chauffeur > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">
                            Nuit chauffeur ({result.supplement_detail.nb_nuits} {result.supplement_detail.nb_nuits > 1 ? 'nuits' : 'nuit'})
                          </span>
                          <span className="text-slate-700">+{result.supplement_detail.nuit_chauffeur} €</span>
                        </div>
                      )}
                      {result.supplement_detail.guide > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">
                            Guide ({result.supplement_detail.nb_jours} {result.supplement_detail.nb_jours > 1 ? 'jours' : 'jour'})
                          </span>
                          <span className="text-slate-700">+{result.supplement_detail.guide} €</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-slate-500">
                      <span>Montant HT</span>
                      <span>{result.devis.montant_ht} €</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>TVA (10 %)</span>
                      <span>{result.devis.montant_tva} €</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 text-base pt-1">
                      <span>Total TTC</span>
                      <span>{result.devis.montant_ttc} €</span>
                    </div>
                    <p className="text-right text-xs text-slate-300">{result.devis.mode_generation}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-sm text-rose-700">
                <p className="font-semibold mb-1">Erreur</p>
                <p>{result.error}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
