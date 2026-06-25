'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'

// ── Rendu d'un résultat de devis ──────────────────────────────────────────────

type DevisOutput = {
  ok: boolean
  error?: string
  reason?: string
  trajet?: { ville_depart: string; ville_arrivee: string; km: number }
  passagers?: number
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
  const cls =
    v > 0 ? 'text-red-600' : v < 0 ? 'text-green-600' : 'text-gray-400'
  return <span className={cls}>{pct(v)}</span>
}

function DevisCard({ output }: { output: DevisOutput }) {
  if (!output.ok) {
    return (
      <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
        <span className="font-medium">Erreur : </span>
        {output.error}
        {output.reason ? ` — ${output.reason}` : ''}
      </div>
    )
  }

  const s = output.supplements ?? { peages: 0, nuit_chauffeur: 0, guide: 0 }
  const c = output.coefficients ?? { saisonnalite: 0, capacite: 0, delai: 0 }
  const p = output.prix ?? { base: 0, montant_ht: 0, montant_tva: 0, montant_ttc: 0 }

  return (
    <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-3">
      <div className="font-semibold text-blue-900">
        Devis — {output.trajet?.ville_depart} → {output.trajet?.ville_arrivee}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-blue-700">
        <span>Distance</span>
        <span className="text-right font-medium">{output.trajet?.km} km</span>
        <span>Passagers</span>
        <span className="text-right font-medium">{output.passagers}</span>
        {(output.dates?.nb_nuits ?? 0) > 0 && (
          <>
            <span>Durée</span>
            <span className="text-right font-medium">
              {output.dates?.nb_nuits} nuit{(output.dates?.nb_nuits ?? 0) > 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      <div className="border-t border-blue-200 pt-2 space-y-1 text-xs text-blue-700">
        <div className="flex justify-between">
          <span>Prix de base</span>
          <span className="font-medium">{p.base} €</span>
        </div>
        <div className="flex justify-between">
          <span>Saisonnalité</span>
          <CoeffSpan v={c.saisonnalite} />
        </div>
        {c.capacite !== 0 && (
          <div className="flex justify-between">
            <span>Capacité</span>
            <CoeffSpan v={c.capacite} />
          </div>
        )}
        <div className="flex justify-between">
          <span>Délai réservation</span>
          <CoeffSpan v={c.delai} />
        </div>
        {s.peages > 0 && (
          <div className="flex justify-between">
            <span>Péages</span>
            <span>+{s.peages} €</span>
          </div>
        )}
        {s.nuit_chauffeur > 0 && (
          <div className="flex justify-between">
            <span>Nuit chauffeur</span>
            <span>+{s.nuit_chauffeur} €</span>
          </div>
        )}
        {s.guide > 0 && (
          <div className="flex justify-between">
            <span>Guide</span>
            <span>+{s.guide} €</span>
          </div>
        )}
      </div>

      <div className="border-t border-blue-300 pt-2 space-y-1">
        <div className="flex justify-between text-xs text-blue-700">
          <span>Montant HT</span>
          <span>{p.montant_ht} €</span>
        </div>
        <div className="flex justify-between text-xs text-blue-700">
          <span>TVA (10 %)</span>
          <span>{p.montant_tva} €</span>
        </div>
        <div className="flex justify-between font-bold text-blue-900">
          <span>Total TTC</span>
          <span>{p.montant_ttc} €</span>
        </div>
        <p className="text-right text-xs text-blue-400">{output.mode}</p>
      </div>
    </div>
  )
}

function EscaladeCard({ output }: { output: { ok: boolean; message: string } }) {
  return (
    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
      <span className="font-medium">🚨 Escalade commerciale — </span>
      {output.message}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function ChatUI() {
  const [inputValue, setInputValue] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/" className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-gray-800 transition-colors">
          N
        </Link>
        <div>
          <p className="font-semibold text-gray-900 text-sm">NeoTravel Assistant</p>
          <p className="text-xs text-gray-400">Devis autocar · calcul déterministe</p>
        </div>
        <span
          className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
            status === 'ready'
              ? 'bg-green-100 text-green-700'
              : status === 'streaming'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-500'
          }`}
        >
          {status === 'ready' ? 'Prêt' : status === 'streaming' ? 'En cours…' : 'Envoi…'}
        </span>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl mx-auto w-full">

        {messages.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🚌</p>
            <p className="font-medium text-gray-600 text-lg">Bonjour ! Je suis l&apos;assistant NeoTravel.</p>
            <p className="text-sm mt-2 max-w-sm mx-auto">
              Décrivez votre projet de transport en autocar et je calculerai votre devis automatiquement.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                'Paris → Lyon, 30 passagers, le 15 septembre',
                'Marseille → Nice aller/retour, 50 personnes, 20 mars',
                '100 personnes Paris → Bordeaux',
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    sendMessage({ text: example })
                  }}
                  className="text-xs bg-white border rounded-full px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="max-w-[85%]">
              {message.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">
                    N
                  </div>
                  <span className="text-xs text-gray-400">NeoTravel</span>
                </div>
              )}

              {message.parts.map((part, i) => {
                if (part.type === 'text' && part.text) {
                  return (
                    <div
                      key={i}
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        message.role === 'user'
                          ? 'bg-black text-white rounded-tr-sm'
                          : 'bg-white border text-gray-800 rounded-tl-sm'
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
                    <div key={i} className="mt-2 text-xs text-gray-400 italic flex items-center gap-1">
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
                    <div key={i} className="mt-2 text-xs text-gray-400 italic flex items-center gap-1">
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
            <div className="bg-white border rounded-2xl rounded-tl-sm px-4 py-3 text-gray-400 flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-4">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Décrivez votre trajet (ex : Paris → Lyon, 40 passagers, le 15 mars)…"
            disabled={status !== 'ready'}
            className="flex-1 border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={status !== 'ready' || !inputValue.trim()}
            className="bg-black text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            Envoyer
          </button>
        </form>
      </div>

    </div>
  )
}
