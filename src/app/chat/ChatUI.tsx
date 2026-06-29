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

// ── DevisCard (inline, sans bouton PDF — panel droit s'en charge) ─────────────

function DevisCard({ output }: { output: DevisOutput }) {
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
    <div className="mt-3 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-sm">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3">
        <div className="font-semibold text-white">{output.trajet?.ville_depart} → {output.trajet?.ville_arrivee}</div>
        <div className="text-slate-400 text-xs mt-0.5">Devis NeoTravel</div>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Distance', value: `${output.trajet?.km} km` },
            { label: 'Passagers', value: `${output.passagers}` },
            { label: 'Type', value: output.aller_retour ? 'Aller/retour' : 'Aller simple' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-2.5 text-center">
              <div className="text-xs text-slate-400">{label}</div>
              <div className="font-semibold text-slate-800 text-xs mt-0.5">{value}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-500"><span>Prix de base</span><span className="font-medium text-slate-700">{p.base} €</span></div>
          <div className="flex justify-between text-slate-500"><span>Saisonnalité</span><CoeffSpan v={c.saisonnalite} /></div>
          {c.capacite !== 0 && <div className="flex justify-between text-slate-500"><span>Capacité</span><CoeffSpan v={c.capacite} /></div>}
          <div className="flex justify-between text-slate-500"><span>Délai réservation</span><CoeffSpan v={c.delai} /></div>
          {s.peages > 0 && <div className="flex justify-between text-slate-500"><span>Péages</span><span>+{s.peages} €</span></div>}
          {s.nuit_chauffeur > 0 && <div className="flex justify-between text-slate-500"><span>Nuit chauffeur</span><span>+{s.nuit_chauffeur} €</span></div>}
          {s.guide > 0 && <div className="flex justify-between text-slate-500"><span>Guide</span><span>+{s.guide} €</span></div>}
        </div>
        <div className="border-t border-slate-100 pt-3 space-y-1 text-xs">
          <div className="flex justify-between text-slate-400"><span>HT</span><span>{p.montant_ht} €</span></div>
          <div className="flex justify-between text-slate-400"><span>TVA 10 %</span><span>{p.montant_tva} €</span></div>
          <div className="flex justify-between font-bold text-slate-900 text-sm pt-1"><span>Total TTC</span><span>{p.montant_ttc} €</span></div>
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

// ── Icônes ────────────────────────────────────────────────────────────────────

function IconChat() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  )
}
function IconDoc() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
function IconUser() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function IconArrowUp() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  )
}
function IconPeople() {
  return (
    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

// ── ChatUI ────────────────────────────────────────────────────────────────────

const EXAMPLES = [
  {
    text: 'Paris → Lyon, 30 passagers, le 15 septembre',
    city: 'Lyon',
    img: 'https://loremflickr.com/280/180/fourviere,lyon?lock=4',
  },
  {
    text: 'Marseille → Nice aller/retour, 50 personnes, 20 mars',
    city: 'Nice',
    img: 'https://loremflickr.com/280/180/nice,riviera?lock=7',
  },
  {
    text: '100 personnes Paris → Bordeaux',
    city: 'Bordeaux',
    img: 'https://loremflickr.com/280/180/bordeaux,france?lock=3',
  },
  {
    text: 'Strasbourg → Paris, 60 passagers, 8 novembre',
    city: 'Strasbourg',
    img: 'https://loremflickr.com/280/180/strasbourg,alsace?lock=2',
  },
  {
    text: 'Lille → Bordeaux aller/retour, 35 personnes, 2 avril',
    city: 'Lille',
    img: 'https://loremflickr.com/280/180/lille,france?lock=6',
  },
  {
    text: 'Nantes → Paris, 80 passagers, le 20 octobre',
    city: 'Nantes',
    img: 'https://loremflickr.com/280/180/nantes,france?lock=8',
  },
]

const RECENT_TRIPS = [
  { label: 'Paris → Bordeaux',  sub: '52 pax · 18 juin', img: 'https://loremflickr.com/80/56/bordeaux,france?lock=3' },
  { label: 'Lyon → Marseille',  sub: '30 pax · 12 juin', img: 'https://loremflickr.com/80/56/marseille,port?lock=5' },
  { label: 'Nantes → Paris',    sub: '45 pax · 3 juin',  img: 'https://loremflickr.com/80/56/paris,france?lock=9' },
  { label: 'Toulouse → Nice',   sub: '28 pax · 27 mai',  img: 'https://loremflickr.com/80/56/nice,riviera?lock=7' },
]

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

  // Extrait le dernier devis réussi pour le panel droit
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
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `devis-neotravel-${lastDevis.trajet?.ville_depart ?? 'devis'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setPdfLoading(false)
    }
  }

  const dataFields = [
    { label: "Ville d'origine",  value: lastDevis?.trajet?.ville_depart ?? null },
    { label: 'Destination',      value: lastDevis?.trajet?.ville_arrivee ?? null },
    { label: 'Date de départ',   value: lastDevis?.dates?.depart ?? null },
    { label: 'Date de retour',   value: lastDevis ? (lastDevis.aller_retour ? (lastDevis.dates?.arrivee ?? null) : 'Aller simple') : null },
    { label: 'Passagers',        value: lastDevis?.passagers ? `${lastDevis.passagers} pax` : null },
    { label: 'Distance',         value: lastDevis?.trajet?.km ? `${lastDevis.trajet.km} km` : null },
    { label: 'Budget indicatif', value: lastDevis?.prix?.montant_ttc ? `${lastDevis.prix.montant_ttc} €` : null },
  ]
  const filledCount = dataFields.filter(f => f.value !== null).length

  return (
    <div className="flex h-screen overflow-hidden bg-white">

      {/* ── Sidebar gauche ── */}
      <aside className="w-72 bg-slate-900 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg">N</div>
            <div>
              <p className="text-white font-bold text-base leading-tight">NeoTravel</p>
              <p className="text-slate-500 text-[10px] tracking-widest uppercase mt-0.5">B2B Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-600 rounded-xl cursor-default">
            <IconChat />
            <span className="text-white text-sm font-medium">Quote Generator</span>
          </div>
          <Link href="/devis" className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <IconDoc />
            <span className="text-sm">Formulaire de devis</span>
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            <span className="text-sm">Mes trajets</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="text-sm">Analytics</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-sm">Paramètres</span>
          </button>

          <div className="pt-5 pb-2 px-3">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Récents</p>
          </div>
          {RECENT_TRIPS.map(({ label, sub, img }) => (
            <button key={label} className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
              <img src={img} alt="" className="w-11 h-8 object-cover rounded-lg shrink-0" />
              <div className="flex flex-col items-start min-w-0">
                <span className="text-xs font-medium truncate w-full text-left">{label}</span>
                <span className="text-[10px] text-slate-600 mt-0.5">{sub}</span>
              </div>
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
          >
            <span className="text-base leading-none">+</span>
            <span>Nouvelle conversation</span>
          </button>
        </div>
      </aside>

      {/* ── Chat central ── */}
      <main className="flex-1 flex flex-col min-w-0 border-r border-slate-100">

        {/* Header central — même hauteur que la sidebar */}
        <div className="shrink-0 border-b border-slate-100 px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-slate-800 text-base leading-tight">Nouvelle conversation</h1>
            <p className="text-xs text-slate-400 mt-0.5">Devis autocar · calcul déterministe</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status === 'ready' ? 'bg-emerald-500' : 'bg-blue-400 animate-pulse'}`} />
            <span className="text-xs text-slate-500 font-medium">
              {status === 'ready' ? 'AI Active' : status === 'streaming' ? 'Génération…' : 'Envoi…'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">

            {isEmpty && (
              <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-lg">🚌</div>
                <h2 className="text-xl font-bold text-slate-800">Bonjour, je suis l&apos;assistant NeoTravel</h2>
                <p className="text-sm text-slate-400 mt-2 max-w-xs leading-relaxed">
                  Décrivez votre projet de transport en autocar, je calcule le devis instantanément.
                </p>
                <div className="mt-8 grid grid-cols-3 gap-3 w-full max-w-2xl">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.text}
                      onClick={() => sendMessage({ text: ex.text })}
                      className="flex flex-col text-left bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 hover:shadow-lg transition-all group"
                    >
                      <div className="relative w-full h-28">
                        <img src={ex.img} alt={ex.city} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <span className="absolute bottom-2 left-2.5 text-xs font-bold text-white drop-shadow uppercase tracking-wider">{ex.city}</span>
                      </div>
                      <div className="px-3 py-2.5">
                        <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors leading-snug">{ex.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-5">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%]">
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white text-[10px] font-bold">AI</div>
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
                                ? 'bg-slate-900 text-white rounded-tr-sm'
                                : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-sm'
                            }`}
                          >
                            {part.text}
                          </div>
                        )
                      }
                      if (part.type === 'tool-calculer_devis') {
                        if (part.state === 'output-available') return <DevisCard key={i} output={part.output as DevisOutput} />
                        return <div key={i} className="mt-2 text-xs text-slate-400 italic flex items-center gap-1.5"><span className="animate-pulse">⏳</span> Calcul en cours…</div>
                      }
                      if (part.type === 'tool-escalade_humain') {
                        if (part.state === 'output-available') return <EscaladeCard key={i} output={part.output as { ok: boolean; message: string }} />
                        return <div key={i} className="mt-2 text-xs text-slate-400 italic flex items-center gap-1.5"><span className="animate-pulse">⏳</span> Escalade en cours…</div>
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

        {/* Input */}
        <div className="shrink-0 border-t border-slate-100 px-4 py-4 bg-white">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-slate-800 focus-within:bg-white transition-all">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything about the group trip..."
                disabled={status !== 'ready'}
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={status !== 'ready' || !inputValue.trim()}
                className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center disabled:opacity-40 transition-colors shrink-0"
              >
                <IconArrowUp />
              </button>
            </div>
            <p className="text-center text-xs text-slate-300 mt-2">
              NeoTravel AI Agent. Pricing is verified by deterministic matrices.
            </p>
          </form>
        </div>
      </main>

      {/* ── Panel droit ── */}
      <aside className="w-80 bg-slate-50 flex flex-col shrink-0 overflow-y-auto border-l border-slate-100">

        {/* Header — même hauteur que sidebar et header central */}
        <div className="px-5 py-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconPeople />
              <span className="text-base font-semibold text-slate-700">
                {lastDevis?.passagers ? `${lastDevis.passagers} pax` : 'Résumé'}
              </span>
            </div>
            <span className="text-xs text-slate-400">Données IA</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3 tabular-nums">
            {lastDevis?.prix?.montant_ttc != null ? `${lastDevis.prix.montant_ttc} €` : '— €'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Total TTC estimé</p>
        </div>

        {/* Data Capture */}
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Data Capture</p>
            <span className="text-xs font-medium text-slate-400">{filledCount}/{dataFields.length}</span>
          </div>

          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(filledCount / dataFields.length) * 100}%` }}
            />
          </div>

          <div className="space-y-3">
            {dataFields.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {value !== null ? <IconCheck /> : <IconClock />}
                  <span className="text-xs text-slate-600 truncate">{label}</span>
                </div>
                <span className={`text-xs font-medium shrink-0 ${value !== null ? 'text-blue-600' : 'text-slate-300'}`}>
                  {value ?? 'MISSING'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-5 py-4 border-b border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
          <button
            onClick={downloadPdf}
            disabled={!lastDevis?.ok || pdfLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-30 transition-colors"
          >
            <IconDoc />
            {pdfLoading ? 'Génération…' : 'Générer le devis PDF'}
          </button>
        </div>

        {/* Metadata */}
        {lastDevis && (
          <div className="px-5 py-4 space-y-2.5 text-xs">
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
      </aside>
    </div>
  )
}
