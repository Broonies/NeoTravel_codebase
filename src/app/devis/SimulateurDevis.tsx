'use client'

import { useState, useTransition } from 'react'
import { calculerDevisAction } from './actions'
import type { DevisActionResult } from './actions'
import Link from 'next/link'

function CoeffLabel({ value }: { value: number }) {
  const pct = (value * 100).toFixed(0)
  const color = value > 0 ? '#e11d48' : value < 0 ? '#059669' : '#a8a8ba'
  return <span style={{ color, fontWeight: 600 }}>{value >= 0 ? '+' : ''}{pct} %</span>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block mb-1.5"
        style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#36364f', letterSpacing: '0.01em' }}
      >
        {label}
      </label>
      {children}
      {hint && <p className="mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6e6e82' }}>{hint}</p>}
    </div>
  )
}

const inputSt: React.CSSProperties = {
  width: '100%',
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  color: '#1e1e32',
  background: '#f8f8fc',
  border: '1px solid #e6e6ee',
  borderRadius: '14px',
  padding: '12px 16px',
  outline: 'none',
  transition: 'all 0.15s',
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
    <div className="min-h-screen" style={{ background: '#f8f8fc' }}>

      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-3 bg-white" style={{ borderBottom: '1px solid #e6e6ee' }}>
        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center font-bold text-sm shrink-0 hover:opacity-80 transition-opacity"
          style={{ background: '#c8db1a', color: '#1e1e32', borderRadius: '12px', fontFamily: 'Poppins, sans-serif' }}
        >
          N
        </Link>
        <div>
          <p className="font-semibold text-sm" style={{ fontFamily: 'Poppins, sans-serif', color: '#1e1e32', letterSpacing: '-0.02em' }}>
            Neo<span style={{ color: '#c8db1a' }}>Travel</span>
          </p>
          <p className="text-xs" style={{ fontFamily: 'Inter, sans-serif', color: '#6e6e82' }}>Formulaire de devis</p>
        </div>
        <Link href="/chat" className="ml-auto flex items-center gap-1.5 text-xs transition-colors hover:opacity-70" style={{ color: '#5a2bd9', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Assistant IA
        </Link>
      </header>

      <div className="max-w-xl mx-auto px-4 py-10">

        <div className="mb-6">
          <h1
            className="font-display"
            style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '28px', color: '#1e1e32', letterSpacing: '-0.02em' }}
          >
            Simulateur de devis
          </h1>
          <p className="mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6e6e82' }}>
            Calcul déterministe · distance + péages via HERE Routing API
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white overflow-hidden" style={{ border: '1px solid #e6e6ee', borderRadius: '22px', boxShadow: '0 18px 40px -18px rgba(30,30,50,.22)' }}>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            <div>
              <p className="mb-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6e6e82', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Trajet</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ville de départ">
                  <input name="ville_depart" type="text" required placeholder="Paris" style={inputSt} />
                </Field>
                <Field label="Ville d'arrivée">
                  <input name="ville_arrivee" type="text" required placeholder="Lyon" style={inputSt} />
                </Field>
              </div>
            </div>

            <div>
              <p className="mb-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6e6e82', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Options</p>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 cursor-pointer select-none" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#36364f' }}>
                  <input name="aller_retour" type="checkbox" className="w-4 h-4 rounded" checked={allerRetour} onChange={e => setAllerRetour(e.target.checked)} style={{ accentColor: '#5a2bd9' }} />
                  Aller / retour
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#36364f' }}>
                  <input name="guide" type="checkbox" className="w-4 h-4 rounded" style={{ accentColor: '#5a2bd9' }} />
                  Guide touristique
                </label>
              </div>
            </div>

            <div>
              <p className="mb-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6e6e82', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Dates</p>
              <div className={`grid gap-3 ${allerRetour ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <Field label="Date de départ">
                  <input name="date_depart" type="date" required style={inputSt} />
                </Field>
                {allerRetour && (
                  <Field label="Date de retour">
                    <input name="date_arrivee" type="date" required style={inputSt} />
                  </Field>
                )}
              </div>
            </div>

            <div>
              <p className="mb-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6e6e82', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Passagers</p>
              <Field label="Nombre de passagers" hint="Max 85 — au-delà, escalade commerciale (HITL)">
                <input name="nb_passagers" type="number" min="1" max="85" required placeholder="30" style={inputSt} />
              </Field>
            </div>

            <Field label="Commentaire (optionnel)">
              <textarea name="commentaire" rows={3} placeholder="Informations complémentaires, exigences particulières…" style={{ ...inputSt, resize: 'none' }} />
            </Field>

            <button
              type="submit"
              disabled={isPending}
              className="w-full font-semibold py-3.5 text-sm disabled:opacity-40 transition-all hover:-translate-y-px"
              style={{ background: '#5a2bd9', color: '#fff', borderRadius: '999px', fontFamily: 'Poppins, sans-serif', fontSize: '14px', boxShadow: '0 10px 22px -10px #5a2bd9' }}
            >
              {isPending ? '⏳ Calcul en cours…' : 'J\'obtiens mon devis'}
            </button>
          </form>
        </div>

        {/* Résultat */}
        {result && (
          <div className="mt-5">
            {result.ok ? (
              <div className="bg-white overflow-hidden" style={{ border: '1px solid #e6e6ee', borderRadius: '22px', boxShadow: '0 18px 40px -18px rgba(30,30,50,.22)' }}>

                {/* Banner lime */}
                <div
                  className="px-5 py-4 text-center font-bold text-sm uppercase tracking-wider"
                  style={{ background: '#c8db1a', color: '#1e1e32', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.04em' }}
                >
                  Résultat du calcul
                </div>

                <div className="p-5 space-y-5">

                  {/* Stats trajet */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Distance', val: `${result.km} km` },
                      { label: 'Péages (classe 4)', val: `${result.peages} €` },
                    ].map(({ label, val }) => (
                      <div key={label} className="p-3 text-center" style={{ background: '#f8f8fc', borderRadius: '14px' }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6e6e82' }}>{label}</p>
                        <p className="font-bold mt-0.5" style={{ fontFamily: 'Poppins, sans-serif', color: '#1e1e32' }}>{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Décomposition */}
                  <div>
                    <p className="mb-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6e6e82', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                      Décomposition du prix
                    </p>
                    <div className="space-y-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
                      {[
                        { label: 'Prix de base',        val: <span style={{ fontWeight: 600, color: '#1e1e32' }}>{result.devis.prix_base} €</span> },
                        { label: 'Saisonnalité',        val: <CoeffLabel value={result.devis.coeff_saisonnalite} /> },
                        { label: 'Capacité véhicule',   val: <CoeffLabel value={result.devis.coeff_capacite} /> },
                        { label: 'Délai de réservation',val: <CoeffLabel value={result.devis.coeff_delai} /> },
                        ...(result.supplement_detail.peages > 0       ? [{ label: 'Péages autoroute', val: <span style={{ color: '#36364f' }}>+{result.supplement_detail.peages} €</span> }] : []),
                        ...(result.supplement_detail.nuit_chauffeur > 0 ? [{ label: `Nuit chauffeur (${result.supplement_detail.nb_nuits} nuit${result.supplement_detail.nb_nuits > 1 ? 's' : ''})`, val: <span style={{ color: '#36364f' }}>+{result.supplement_detail.nuit_chauffeur} €</span> }] : []),
                        ...(result.supplement_detail.guide > 0          ? [{ label: `Guide (${result.supplement_detail.nb_jours} jour${result.supplement_detail.nb_jours > 1 ? 's' : ''})`, val: <span style={{ color: '#36364f' }}>+{result.supplement_detail.guide} €</span> }] : []),
                      ].map(({ label, val }) => (
                        <div key={label} className="flex justify-between">
                          <span style={{ color: '#6e6e82' }}>{label}</span>
                          {val}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="space-y-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', borderTop: '1px solid #e6e6ee', paddingTop: '16px' }}>
                    <div className="flex justify-between" style={{ color: '#6e6e82' }}>
                      <span>Montant HT</span><span>{result.devis.montant_ht} €</span>
                    </div>
                    <div className="flex justify-between" style={{ color: '#6e6e82' }}>
                      <span>TVA (10 %)</span><span>{result.devis.montant_tva} €</span>
                    </div>
                    <div
                      className="py-3 text-center font-bold text-xl"
                      style={{ background: '#c8db1a', color: '#1e1e32', borderRadius: '8px', fontFamily: 'Poppins, sans-serif', marginTop: '8px' }}
                    >
                      Tarif TTC : {result.devis.montant_ttc} €
                      <div className="text-xs font-normal mt-0.5" style={{ color: '#4a5400', fontFamily: 'Inter, sans-serif' }}>
                        Transports en France soumis au taux de TVA de 10 %
                      </div>
                    </div>
                    <p className="text-right" style={{ fontSize: '11px', color: '#a8a8ba', fontFamily: 'Inter, sans-serif' }}>
                      {result.devis.mode_generation}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 text-sm" style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '14px', color: '#b91c1c', fontFamily: 'Inter, sans-serif' }}>
                <p className="font-semibold mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Erreur</p>
                <p>{result.error}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
