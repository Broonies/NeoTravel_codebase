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
  pdf_url?: string
  lead_id?: number
  demande_id?: number
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
    if (output.pdf_url) {
      window.open(output.pdf_url, '_blank')
      return
    }
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
            ...((output.dates?.nb_nuits ?? 0) > 0
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

        <div className="space-y-2">
          <button
            onClick={downloadPdf}
            disabled={pdfLoading}
            className="w-full bg-slate-900 text-white rounded-xl py-2.5 text-xs font-medium hover:bg-slate-700 disabled:opacity-40 transition-colors"
          >
            {pdfLoading ? '⏳ Génération…' : '⬇ Télécharger le devis PDF'}
          </button>
          {output.pdf_url && (
            <a
              href={output.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center bg-white border border-slate-200 text-slate-700 rounded-xl py-2.5 text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              ↗ Voir le devis en ligne
            </a>
          )}
        </div>
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

// ── Data ───────────────────────────────────────────────────────────────────────

const EXAMPLES = [
  { city: 'Paris → Lyon',              img: 'https://loremflickr.com/320/200/paris,eiffel?lock=9',         hint: '30 passagers · 15 sept' },
  { city: 'Marseille → Nice',          img: 'https://loremflickr.com/320/200/marseille,port?lock=5',        hint: '50 pers. · aller/retour' },
  { city: 'Paris → Bordeaux',          img: 'https://loremflickr.com/320/200/bordeaux,france?lock=3',       hint: '100 personnes' },
  { city: 'Lyon → Barcelone',          img: 'https://loremflickr.com/320/200/barcelona,spain?lock=15',      hint: '45 pers. · weekend' },
  { city: 'Nantes → Strasbourg',       img: 'https://loremflickr.com/320/200/strasbourg,alsace?lock=2',     hint: '35 pers. · aller simple' },
  { city: 'Paris → Mont-Saint-Michel', img: 'https://loremflickr.com/320/200/mont-saint-michel?lock=11',   hint: '55 personnes' },
]

const RECENT_TRIPS = [
  { label: 'Paris → Lyon',     date: '12 juin', img: 'https://loremflickr.com/80/55/paris,eiffel?lock=9'     },
  { label: 'Marseille → Nice', date: '8 juin',  img: 'https://loremflickr.com/80/55/marseille,port?lock=5'   },
  { label: 'Paris → Bordeaux', date: '3 juin',  img: 'https://loremflickr.com/80/55/bordeaux,france?lock=3'  },
  { label: 'Lyon → Barcelone', date: '28 mai',  img: 'https://loremflickr.com/80/55/barcelona,spain?lock=15' },
]

const CAPTURE_FIELDS = [
  "Ville de départ",
  "Ville d'arrivée",
  "Date de départ",
  "Nombre de passagers",
  "Aller / retour",
  "Hébergement nuit",
  "Guide touristique",
]

// ── ChatUI ────────────────────────────────────────────────────────────────────

export default function ChatUI() {
  const [inputValue, setInputValue] = useState('')
  const [lastDevis, setLastDevis] = useState<DevisOutput | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isEmpty = messages.length === 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    for (const msg of [...messages].reverse()) {
      for (const part of [...msg.parts].reverse()) {
        if (part.type === 'tool-calculer_devis' && part.state === 'output-available') {
          const output = part.output as DevisOutput
          if (output.ok) { setLastDevis(output); return }
        }
      }
    }
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = inputValue.trim()
    if (!text || status !== 'ready') return
    sendMessage({ text })
    setInputValue('')
  }

  async function downloadPdf() {
    if (!lastDevis) return
    setPdfLoading(true)
    try {
      const res = await fetch('/api/devis/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastDevis),
      })
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `devis-neotravel-${lastDevis.trajet?.ville_depart ?? 'devis'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setPdfLoading(false)
    }
  }

  const captured = lastDevis ? [
    !!lastDevis.trajet?.ville_depart,
    !!lastDevis.trajet?.ville_arrivee,
    !!lastDevis.dates?.depart,
    !!lastDevis.passagers,
    lastDevis.aller_retour !== undefined,
    (lastDevis.dates?.nb_nuits ?? 0) > 0,
    (lastDevis.supplements?.guide ?? 0) > 0,
  ] : Array(7).fill(false) as boolean[]

  const capturedCount = captured.filter(Boolean).length

  return (
    <div className="h-screen bg-slate-900 flex overflow-hidden">

      {/* ── Sidebar gauche ── */}
      <aside className="w-72 bg-slate-900 border-r border-white/5 flex flex-col shrink-0">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/5">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">N</div>
          <div>
            <p className="text-white font-bold text-sm">NeoTravel</p>
            <p className="text-slate-500 text-xs">B2B Platform</p>
          </div>
        </div>

        <nav className="px-3 py-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            Générateur de devis
          </button>
          <Link href="/devis" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Formulaire de devis
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            Mes trajets
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Analytics
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Paramètres
          </button>
        </nav>

        <div className="px-5 pt-2 pb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Récents</p>
        </div>
        <div className="px-3 space-y-1 flex-1 overflow-y-auto">
          {RECENT_TRIPS.map((trip) => (
            <button key={trip.label} className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 text-left transition-colors group">
              <img src={trip.img} alt={trip.label} className="w-11 h-8 rounded-lg object-cover shrink-0" />
              <div className="min-w-0">
                <p className="text-slate-300 text-xs font-medium truncate group-hover:text-white transition-colors">{trip.label}</p>
                <p className="text-slate-600 text-xs">{trip.date}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-white/10 hover:bg-white/15 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            + Nouvelle conversation
          </button>
        </div>
      </aside>

      {/* ── Centre : Chat ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">

        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h1 className="font-semibold text-slate-800">Nouvelle conversation</h1>
            <p className="text-xs text-slate-400 mt-0.5">Assistant devis autocar · B2B</p>
          </div>
          <div className="flex items-center gap-2">
            {status !== 'ready' && (
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                {status === 'streaming' ? 'En cours…' : 'Envoi…'}
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-medium px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              AI Active
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl mx-auto">

            {isEmpty && (
              <div>
                <p className="text-center text-sm text-slate-400 mb-6">Choisissez une destination ou décrivez votre trajet</p>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.city}
                      onClick={() => sendMessage({ text: `${ex.city}, ${ex.hint}` })}
                      className="group relative rounded-2xl overflow-hidden cursor-pointer focus:outline-none"
                    >
                      <img src={ex.img} alt={ex.city} className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                        <p className="text-white font-semibold text-xs">{ex.city}</p>
                        <p className="text-white/70 text-xs">{ex.hint}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-5">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[80%]">
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-5 h-5 bg-blue-500 rounded-md flex items-center justify-center text-white text-xs font-bold">N</div>
                        <span className="text-xs text-slate-400 font-medium">NeoTravel AI</span>
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
                            <span className="animate-pulse">⏳</span> Calcul du devis…
                          </div>
                        )
                      }
                      if (part.type === 'tool-escalade_humain') {
                        if (part.state === 'output-available') {
                          return <EscaladeCard key={i} output={part.output as { ok: boolean; message: string }} />
                        }
                        return (
                          <div key={i} className="mt-2 text-xs text-slate-400 italic flex items-center gap-1.5">
                            <span className="animate-pulse">⏳</span> Escalade…
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

        <div className="px-6 py-4 border-t border-slate-100 shrink-0">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ex : Paris → Lyon, 40 passagers, le 15 mars…"
              disabled={status !== 'ready'}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:opacity-40 transition-all"
            />
            <button
              type="submit"
              disabled={status !== 'ready' || !inputValue.trim()}
              className="bg-blue-600 text-white rounded-2xl px-5 py-3 text-sm font-medium hover:bg-blue-500 disabled:opacity-40 transition-colors shrink-0"
            >
              ↑
            </button>
          </form>
        </div>
      </main>

      {/* ── Panneau droit ── */}
      <aside className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col shrink-0">

        <div className="px-5 py-5 border-b border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">
              {lastDevis?.passagers ? `${lastDevis.passagers} passagers` : '— passagers'}
            </span>
            <span className="text-xs font-medium text-slate-500">Résumé</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {lastDevis?.prix?.montant_ttc ? `${lastDevis.prix.montant_ttc} €` : '—'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Total TTC estimé</p>
        </div>

        <div className="px-5 py-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Données captées</p>
            <span className="text-xs text-slate-400">{capturedCount}/{CAPTURE_FIELDS.length}</span>
          </div>

          <div className="w-full h-1.5 bg-slate-200 rounded-full mb-4">
            <div
              className="h-1.5 bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${(capturedCount / CAPTURE_FIELDS.length) * 100}%` }}
            />
          </div>

          <div className="space-y-2">
            {CAPTURE_FIELDS.map((field, i) => (
              <div key={field} className="flex items-center gap-2.5 py-1.5">
                <div className={`w-2 h-2 rounded-full shrink-0 ${captured[i] ? 'bg-blue-600' : 'bg-slate-300'}`} />
                <span className={`text-xs ${captured[i] ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                  {field}
                </span>
                {!captured[i] && (
                  <span className="ml-auto text-xs text-slate-300">MISSING</span>
                )}
              </div>
            ))}
          </div>

          {lastDevis && (
            <button
              onClick={downloadPdf}
              disabled={pdfLoading}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-3 rounded-xl transition-colors disabled:opacity-40"
            >
              {pdfLoading ? '⏳ Génération…' : '⬇ Générer le devis PDF'}
            </button>
          )}

          {lastDevis && (
            <div className="mt-5 pt-4 border-t border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Agent</span>
                <span className="text-slate-600 font-medium">NeoTravel AI v2.1</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Matrix</span>
                <span className="text-emerald-600 font-medium">✓ Loaded</span>
              </div>
              {lastDevis.mode && (
                <div className="flex justify-between text-slate-400">
                  <span>Mode</span>
                  <span className="text-emerald-600 font-medium">✓ {lastDevis.mode}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

    </div>
  )
}
