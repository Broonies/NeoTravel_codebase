'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

type DevisOutput = {
  ok: boolean
  error?: string
  reason?: string
  trajet?: { ville_depart: string; ville_arrivee: string; km: number }
  passagers?: number
  aller_retour?: boolean
  dates?: { depart: string; arrivee: string; nb_nuits: number }
  prix?: { base: number; montant_ht: number; montant_tva: number; montant_ttc: number }
  coefficients?: { saisonnalite: number; capacite: number; delai: number }
  supplements?: { peages: number; nuit_chauffeur: number; guide: number }
  mode?: string
}

function pct(v: number) {
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(0)} %`
}

function CoeffSpan({ v }: { v: number }) {
  const cls = v > 0 ? 'text-rose-500' : v < 0 ? 'text-emerald-600' : 'text-slate-400'
  return <span className={cls}>{pct(v)}</span>
}

// ── DevisCard ─────────────────────────────────────────────────────────────────

function DevisCard({ output }: { output: DevisOutput }) {
  const [pdfLoading, setPdfLoading] = useState(false)

  async function downloadPdf() {
    setPdfLoading(true)
    try {
      const res = await fetch('/api/devis/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(output),
      })
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `devis-neotravel-${output.trajet?.ville_depart ?? 'devis'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setPdfLoading(false)
    }
  }

  if (!output.ok) {
    return (
      <div className="mt-3 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-700">
        <span className="font-semibold">Erreur : </span>
        {output.error}
        {output.reason ? ` — ${output.reason}` : ''}
      </div>
    )
  }

  const s = output.supplements ?? { peages: 0, nuit_chauffeur: 0, guide: 0 }
  const c = output.coefficients ?? { saisonnalite: 0, capacite: 0, delai: 0 }
  const p = output.prix ?? { base: 0, montant_ht: 0, montant_tva: 0, montant_ttc: 0 }

  return (
    <div className="mt-3 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md text-sm">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3">
        <div className="font-semibold text-white text-sm">
          {output.trajet?.ville_depart} → {output.trajet?.ville_arrivee}
        </div>
        <div className="text-slate-400 text-xs mt-0.5">Devis NeoTravel</div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Distance', value: `${output.trajet?.km} km` },
            { label: 'Passagers', value: `${output.passagers}` },
            ...(( output.dates?.nb_nuits ?? 0) > 0
              ? [{ label: 'Durée', value: `${output.dates?.nb_nuits} nuit${(output.dates?.nb_nuits ?? 0) > 1 ? 's' : ''}` }]
              : [{ label: 'Type', value: output.aller_retour ? 'Aller/retour' : 'Aller simple' }]
            ),
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-2.5 text-center">
              <div className="text-xs text-slate-400">{label}</div>
              <div className="font-semibold text-slate-800 text-xs mt-0.5">{value}</div>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Prix de base</span>
            <span className="font-medium text-slate-700">{p.base} €</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Saisonnalité</span>
            <CoeffSpan v={c.saisonnalite} />
          </div>
          {c.capacite !== 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Capacité</span>
              <CoeffSpan v={c.capacite} />
            </div>
          )}
          <div className="flex justify-between text-slate-500">
            <span>Délai réservation</span>
            <CoeffSpan v={c.delai} />
          </div>
          {s.peages > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Péages</span>
              <span className="text-slate-700">+{s.peages} €</span>
            </div>
          )}
          {s.nuit_chauffeur > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Nuit chauffeur</span>
              <span className="text-slate-700">+{s.nuit_chauffeur} €</span>
            </div>
          )}
          {s.guide > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Guide</span>
              <span className="text-slate-700">+{s.guide} €</span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-3 space-y-1 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Montant HT</span>
            <span>{p.montant_ht} €</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>TVA (10 %)</span>
            <span>{p.montant_tva} €</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
            <span>Total TTC</span>
            <span>{p.montant_ttc} €</span>
          </div>
          {output.mode && (
            <p className="text-right text-slate-300 text-xs pt-0.5">{output.mode}</p>
          )}
        </div>

        <button
          onClick={downloadPdf}
          disabled={pdfLoading}
          className="w-full bg-slate-900 text-white rounded-xl py-2.5 text-xs font-medium hover:bg-slate-700 disabled:opacity-40 transition-colors"
        >
          {pdfLoading ? '⏳ Génération…' : '⬇ Télécharger le devis PDF'}
        </button>
      </div>
    </div>
  )
}

function EscaladeCard({ output }: { output: { ok: boolean; message: string } }) {
  return (
    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
      <span className="font-semibold">🚨 Escalade commerciale — </span>
      {output.message}
    </div>
  )
}

// ── ChatUI ────────────────────────────────────────────────────────────────────

const EXAMPLES = [
  'Paris → Lyon, 30 passagers, le 15 septembre',
  'Marseille → Nice aller/retour, 50 personnes, 20 mars',
  '100 personnes Paris → Bordeaux',
]

export default function ChatUI() {
  const [inputValue, setInputValue] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isEmpty = messages.length === 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = inputValue.trim()
    if (!text || status !== 'ready') return
    sendMessage({ text })
    setInputValue('')
  }

  function handleExample(text: string) {
    sendMessage({ text })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header minimal */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-bold hover:bg-slate-700 transition-colors shrink-0">
          N
        </Link>
        <span className="font-semibold text-slate-800 text-sm">NeoTravel</span>

        <div className="ml-auto flex items-center gap-2">
          {/* Indicateur de statut */}
          {status !== 'ready' && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              {status === 'streaming' ? 'En cours…' : 'Envoi…'}
            </span>
          )}

          {/* Bouton formulaire */}
          <Link
            href="/devis"
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Formulaire de devis
          </Link>
        </div>
      </header>

      {/* Zone messages — centrée */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 w-full">

          {/* Empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-lg">
                🚌
              </div>
              <h1 className="text-xl font-bold text-slate-800">Bonjour, je suis l&apos;assistant NeoTravel</h1>
              <p className="text-sm text-slate-400 mt-2 max-w-xs">
                Décrivez votre projet de transport en autocar, je calcule le devis instantanément.
              </p>
              <div className="mt-8 flex flex-col gap-2 w-full max-w-sm">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => handleExample(ex)}
                    className="text-left text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[85%]">
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-5 h-5 bg-slate-900 rounded-md flex items-center justify-center text-white text-xs font-bold">
                        N
                      </div>
                      <span className="text-xs text-slate-400 font-medium">NeoTravel</span>
                    </div>
                  )}

                  {message.parts.map((part, i) => {
                    if (part.type === 'text' && part.text) {
                      return (
                        <div
                          key={i}
                          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                            message.role === 'user'
                              ? 'bg-slate-900 text-white rounded-tr-sm shadow-sm'
                              : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-sm'
                          }`}
                        >
                          {part.text}
                        </div>
                      )
                    }

                    if (part.type === 'tool-calculer_devis') {
                      if (part.state === 'output-available') {
                        return <DevisCard key={i} output={part.output as DevisOutput} />
                      }
                      return (
                        <div key={i} className="mt-2 text-xs text-slate-400 italic flex items-center gap-1.5">
                          <span className="animate-pulse">⏳</span> Calcul du devis en cours…
                        </div>
                      )
                    }

                    if (part.type === 'tool-escalade_humain') {
                      if (part.state === 'output-available') {
                        return (
                          <EscaladeCard
                            key={i}
                            output={part.output as { ok: boolean; message: string }}
                          />
                        )
                      }
                      return (
                        <div key={i} className="mt-2 text-xs text-slate-400 italic flex items-center gap-1.5">
                          <span className="animate-pulse">⏳</span> Escalade en cours…
                        </div>
                      )
                    }

                    return null
                  })}
                </div>
              </div>
            ))}

            {status === 'submitted' && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                  <span className="animate-bounce text-slate-400" style={{ animationDelay: '0ms' }}>•</span>
                  <span className="animate-bounce text-slate-400" style={{ animationDelay: '150ms' }}>•</span>
                  <span className="animate-bounce text-slate-400" style={{ animationDelay: '300ms' }}>•</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* Input ancré en bas */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 px-4 py-4">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ex : Paris → Lyon, 40 passagers, le 15 mars…"
            disabled={status !== 'ready'}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white disabled:opacity-40 transition-all"
          />
          <button
            type="submit"
            disabled={status !== 'ready' || !inputValue.trim()}
            className="bg-slate-900 text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-slate-700 disabled:opacity-40 transition-colors shrink-0"
          >
            ↑
          </button>
        </form>
        <p className="text-center text-xs text-slate-300 mt-2">
          NeoTravel · Devis autocar déterministe
        </p>
      </div>

    </div>
  )
}
