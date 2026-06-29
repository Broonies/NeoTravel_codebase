'use client'

import { useState, useTransition } from 'react'
import { calculerDevisAction } from './actions'
import type { DevisActionResult } from './actions'
import Link from 'next/link'

function CoeffLabel({ value }: { value: number }) {
  const pct = (value * 100).toFixed(0)
  const color = value > 0 ? 'text-rose-400' : value < 0 ? 'text-emerald-400' : 'text-white/30'
  return <span className={color}>{value >= 0 ? '+' : ''}{pct} %</span>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-white/20 mt-1">{hint}</p>}
    </div>
  )
}

const inputCls = 'w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-all'
const inputSt: React.CSSProperties = { background: '#1a1a1a', border: '1px solid #2a2a2a' }

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
    <div className="min-h-screen" style={{ background: '#080808' }}>

      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-3 border-b" style={{ borderColor: '#1e1e1e' }}>
        <Link href="/" className="w-8 h-8 rounded-lg flex items-center justify-center text-black text-xs font-bold font-display shrink-0 hover:opacity-80 transition-opacity" style={{ background: '#c8ff00' }}>
          N
        </Link>
        <div>
          <p className="font-semibold text-white text-sm font-display">NeoTravel</p>
          <p className="text-xs text-white/30 font-display">Formulaire de devis</p>
        </div>
        <Link href="/chat" className="ml-auto flex items-center gap-1.5 text-white/30 hover:text-white text-xs transition-colors font-display">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Assistant IA
        </Link>
      </header>

      <div className="max-w-xl mx-auto px-4 py-10">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white font-display">Simulateur de devis</h1>
          <p className="text-sm text-white/30 mt-1">Calcul déterministe · distance + péages via HERE Routing API</p>
        </div>

        {/* Formulaire */}
        <div className="rounded-2xl overflow-hidden border" style={{ background: '#111', borderColor: '#1e1e1e' }}>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 font-display">Trajet</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ville de départ">
                  <input name="ville_depart" type="text" required placeholder="Paris" className={inputCls} style={inputSt} />
                </Field>
                <Field label="Ville d'arrivée">
                  <input name="ville_arrivee" type="text" required placeholder="Lyon" className={inputCls} style={inputSt} />
                </Field>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 font-display">Options</p>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer select-none">
                  <input name="aller_retour" type="checkbox" className="w-4 h-4 rounded" checked={allerRetour} onChange={e => setAllerRetour(e.target.checked)} />
                  Aller / retour
                </label>
                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer select-none">
                  <input name="guide" type="checkbox" className="w-4 h-4 rounded" />
                  Guide touristique
                </label>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 font-display">Dates</p>
              <div className={`grid gap-3 ${allerRetour ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <Field label="Date de départ">
                  <input name="date_depart" type="date" required className={inputCls} style={inputSt} />
                </Field>
                {allerRetour && (
                  <Field label="Date de retour">
                    <input name="date_arrivee" type="date" required className={inputCls} style={inputSt} />
                  </Field>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 font-display">Passagers</p>
              <Field label="Nombre de passagers" hint="Max 85 — au-delà, escalade commerciale (HITL)">
                <input name="nb_passagers" type="number" min="1" max="85" required placeholder="30" className={inputCls} style={inputSt} />
              </Field>
            </div>

            <Field label="Commentaire (optionnel)">
              <textarea name="commentaire" rows={3} placeholder="Informations complémentaires…" className={`${inputCls} resize-none`} style={inputSt} />
            </Field>

            <button type="submit" disabled={isPending} className="w-full text-black py-3 rounded-xl text-sm font-bold disabled:opacity-40 transition-all font-display" style={{ background: '#c8ff00' }}>
              {isPending ? '⏳ Calcul en cours…' : 'Calculer le devis'}
            </button>
          </form>
        </div>

        {/* Résultat */}
        {result && (
          <div className="mt-5">
            {result.ok ? (
              <div className="rounded-2xl overflow-hidden border" style={{ background: '#111', borderColor: '#1e1e1e' }}>
                <div className="px-5 py-4 border-b" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
                  <p className="font-semibold text-white font-display">Résultat du calcul</p>
                  <p className="text-xs text-white/30 mt-0.5">via HERE Routing API</p>
                </div>

                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3 text-center" style={{ background: '#1a1a1a' }}>
                      <p className="text-xs text-white/30">Distance</p>
                      <p className="font-bold text-white mt-0.5">{result.km} km</p>
                    </div>
                    <div className="rounded-xl p-3 text-center" style={{ background: '#1a1a1a' }}>
                      <p className="text-xs text-white/30">Péages (classe 4)</p>
                      <p className="font-bold text-white mt-0.5">{result.peages} €</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 font-display">Décomposition du prix</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/50">Prix de base</span>
                        <span className="font-medium text-white">{result.devis.prix_base} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Saisonnalité</span>
                        <CoeffLabel value={result.devis.coeff_saisonnalite} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Capacité véhicule</span>
                        <CoeffLabel value={result.devis.coeff_capacite} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Délai de réservation</span>
                        <CoeffLabel value={result.devis.coeff_delai} />
                      </div>
                      {result.supplement_detail.peages > 0 && (
                        <div className="flex justify-between">
                          <span className="text-white/50">Péages autoroute</span>
                          <span className="text-white">+{result.supplement_detail.peages} €</span>
                        </div>
                      )}
                      {result.supplement_detail.nuit_chauffeur > 0 && (
                        <div className="flex justify-between">
                          <span className="text-white/50">Nuit chauffeur ({result.supplement_detail.nb_nuits} {result.supplement_detail.nb_nuits > 1 ? 'nuits' : 'nuit'})</span>
                          <span className="text-white">+{result.supplement_detail.nuit_chauffeur} €</span>
                        </div>
                      )}
                      {result.supplement_detail.guide > 0 && (
                        <div className="flex justify-between">
                          <span className="text-white/50">Guide ({result.supplement_detail.nb_jours} {result.supplement_detail.nb_jours > 1 ? 'jours' : 'jour'})</span>
                          <span className="text-white">+{result.supplement_detail.guide} €</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 space-y-2 text-sm" style={{ borderTop: '1px solid #2a2a2a' }}>
                    <div className="flex justify-between text-white/30">
                      <span>Montant HT</span>
                      <span>{result.devis.montant_ht} €</span>
                    </div>
                    <div className="flex justify-between text-white/30">
                      <span>TVA (10 %)</span>
                      <span>{result.devis.montant_tva} €</span>
                    </div>
                    <div className="flex justify-between font-bold text-white text-base pt-1">
                      <span>Total TTC</span>
                      <span style={{ color: '#c8ff00' }}>{result.devis.montant_ttc} €</span>
                    </div>
                    <p className="text-right text-xs text-white/20 font-display">{result.devis.mode_generation}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-5 text-sm text-rose-400 border border-rose-500/30" style={{ background: '#1a0a0a' }}>
                <p className="font-semibold mb-1 font-display">Erreur</p>
                <p>{result.error}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
