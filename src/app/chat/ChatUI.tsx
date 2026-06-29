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
  const cls = v > 0 ? 'text-rose-400' : v < 0 ? 'text-emerald-400' : 'text-white/30'
  return <span className={cls}>{pct(v)}</span>
}

// ── DevisCard ─────────────────────────────────────────────────────────────────

function DevisCard({ output }: { output: DevisOutput }) {
  if (!output.ok) {
    return (
      <div className="mt-3 rounded-2xl p-4 text-sm text-rose-400 border border-rose-500/30" style={{ background: '#1a0a0a' }}>
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
    <div className="mt-3 rounded-2xl overflow-hidden text-sm border" style={{ background: '#111', borderColor: '#2a2a2a' }}>
      <div className="px-4 py-3" style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
        <div className="font-semibold text-white text-sm font-display">
          {output.trajet?.ville_depart} → {output.trajet?.ville_arrivee}
        </div>
        <div className="text-white/30 text-xs mt-0.5">Devis NeoTravel</div>
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
            <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: '#1a1a1a' }}>
              <div className="text-xs text-white/30">{label}</div>
              <div className="font-semibold text-white text-xs mt-0.5">{value}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-white/50">
            <span>Prix de base</span>
            <span className="font-medium text-white">{p.base} €</span>
          </div>
          <div className="flex justify-between text-white/50">
            <span>Saisonnalité</span>
            <CoeffSpan v={c.saisonnalite} />
          </div>
          {c.capacite !== 0 && (
            <div className="flex justify-between text-white/50">
              <span>Capacité</span>
              <CoeffSpan v={c.capacite} />
            </div>
          )}
          <div className="flex justify-between text-white/50">
            <span>Délai réservation</span>
            <CoeffSpan v={c.delai} />
          </div>
          {s.peages > 0 && (
            <div className="flex justify-between text-white/50">
              <span>Péages</span>
              <span className="text-white">+{s.peages} €</span>
            </div>
          )}
          {s.nuit_chauffeur > 0 && (
            <div className="flex justify-between text-white/50">
              <span>Nuit chauffeur</span>
              <span className="text-white">+{s.nuit_chauffeur} €</span>
            </div>
          )}
          {s.guide > 0 && (
            <div className="flex justify-between text-white/50">
              <span>Guide</span>
              <span className="text-white">+{s.guide} €</span>
            </div>
          )}
        </div>
        <div className="pt-3 space-y-1 text-xs" style={{ borderTop: '1px solid #2a2a2a' }}>
          <div className="flex justify-between text-white/30">
            <span>Montant HT</span>
            <span>{p.montant_ht} €</span>
          </div>
          <div className="flex justify-between text-white/30">
            <span>TVA (10 %)</span>
            <span>{p.montant_tva} €</span>
          </div>
          <div className="flex justify-between font-bold text-white text-sm pt-1">
            <span>Total TTC</span>
            <span style={{ color: '#c8ff00' }}>{p.montant_ttc} €</span>
          </div>
          {output.mode && (
            <p className="text-right text-white/20 text-xs pt-0.5 font-display">{output.mode}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function EscaladeCard({ output }: { output: { ok: boolean; message: string } }) {
  return (
    <div className="mt-3 rounded-2xl p-4 text-sm text-amber-400 border border-amber-500/30" style={{ background: '#1a1500' }}>
      <span className="font-semibold">🚨 Escalade commerciale — </span>
      {output.message}
    </div>
  )
}

// ── Data ───────────────────────────────────────────────────────────────────────

const EXAMPLES = [
  { city: 'Paris → Lyon',              img: 'https://picsum.photos/seed/paris/320/200',      hint: '30 passagers · 15 sept' },
  { city: 'Marseille → Nice',          img: 'https://picsum.photos/seed/marseille/320/200',  hint: '50 pers. · aller/retour' },
  { city: 'Paris → Bordeaux',          img: 'https://picsum.photos/seed/bordeaux/320/200',   hint: '100 personnes' },
  { city: 'Lyon → Barcelone',          img: 'https://picsum.photos/seed/barcelona/320/200',  hint: '45 pers. · weekend' },
  { city: 'Nantes → Strasbourg',       img: 'https://picsum.photos/seed/strasbourg/320/200', hint: '35 pers. · aller simple' },
  { city: 'Paris → Mont-Saint-Michel', img: 'https://picsum.photos/seed/normandie/320/200',  hint: '55 personnes' },
]

const RECENT_TRIPS = [
  { label: 'Paris → Lyon',     date: '12 juin', img: 'https://picsum.photos/seed/paris/80/55'      },
  { label: 'Marseille → Nice', date: '8 juin',  img: 'https://picsum.photos/seed/marseille/80/55'  },
  { label: 'Paris → Bordeaux', date: '3 juin',  img: 'https://picsum.photos/seed/bordeaux/80/55'   },
  { label: 'Lyon → Barcelone', date: '28 mai',  img: 'https://picsum.photos/seed/barcelona/80/55'  },
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
    <div className="h-screen flex overflow-hidden" style={{ background: '#080808' }}>

      {/* ── Sidebar gauche ── */}
      <aside className="w-72 flex flex-col shrink-0 border-r" style={{ background: '#080808', borderColor: '#1e1e1e' }}>

        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b" style={{ borderColor: '#1e1e1e' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-black font-bold text-sm" style={{ background: '#c8ff00' }}>N</div>
          <div>
            <p className="text-white font-bold text-sm font-display">NeoTravel</p>
            <p className="text-white/30 text-xs font-display">B2B Platform</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1">
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-black text-sm font-semibold font-display"
            style={{ background: '#c8ff00' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            Générateur de devis
          </button>
          {[
            { href: '/devis', label: 'Formulaire de devis', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
          ].map(({ href, label, icon }) => (
            <Link key={label} href={href} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-white text-sm transition-colors" style={{} as React.CSSProperties}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
              {label}
            </Link>
          ))}
          {[
            { label: 'Mes trajets',  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /> },
            { label: 'Analytics',   icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
            { label: 'Paramètres',  icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></> },
          ].map(({ label, icon }) => (
            <button key={label} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-white text-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
              {label}
            </button>
          ))}
        </nav>

        {/* Récents */}
        <div className="px-5 pt-2 pb-2">
          <p className="text-xs font-semibold text-white/20 uppercase tracking-wider font-display">Récents</p>
        </div>
        <div className="px-3 space-y-1 flex-1 overflow-y-auto">
          {RECENT_TRIPS.map((trip) => (
            <button key={trip.label} className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 text-left transition-colors group">
              <img src={trip.img} alt={trip.label} className="w-11 h-8 rounded-lg object-cover shrink-0" />
              <div className="min-w-0">
                <p className="text-white/60 text-xs font-medium truncate group-hover:text-white transition-colors">{trip.label}</p>
                <p className="text-white/20 text-xs">{trip.date}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Nouvelle conversation */}
        <div className="p-4 border-t" style={{ borderColor: '#1e1e1e' }}>
          <button
            onClick={() => window.location.reload()}
            className="w-full text-white/60 hover:text-white text-sm font-medium py-2.5 rounded-xl transition-colors border font-display"
            style={{ borderColor: '#2a2a2a' }}
          >
            + Nouvelle conversation
          </button>
        </div>
      </aside>

      {/* ── Centre : Chat ── */}
      <main className="flex-1 flex flex-col min-w-0" style={{ background: '#0d0d0d' }}>

        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between shrink-0 border-b" style={{ borderColor: '#1e1e1e' }}>
          <div>
            <h1 className="font-semibold text-white font-display">Nouvelle conversation</h1>
            <p className="text-xs text-white/30 mt-0.5">Assistant devis autocar · B2B</p>
          </div>
          <div className="flex items-center gap-2">
            {status !== 'ready' && (
              <span className="text-xs text-white/30 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#c8ff00' }} />
                {status === 'streaming' ? 'En cours…' : 'Envoi…'}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full font-display" style={{ background: 'rgba(200,255,0,0.08)', color: '#c8ff00', border: '1px solid rgba(200,255,0,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#c8ff00' }} />
              AI Active
            </span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl mx-auto">

            {isEmpty && (
              <div>
                <p className="text-center text-sm text-white/30 mb-6 font-display">Choisissez une destination ou décrivez votre trajet</p>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.city}
                      onClick={() => sendMessage({ text: `${ex.city}, ${ex.hint}` })}
                      className="group relative rounded-2xl overflow-hidden cursor-pointer focus:outline-none border"
                      style={{ borderColor: '#1e1e1e' }}
                    >
                      <img src={ex.img} alt={ex.city} className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                        <p className="text-white font-semibold text-xs font-display">{ex.city}</p>
                        <p className="text-white/50 text-xs">{ex.hint}</p>
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
                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-black text-xs font-bold font-display" style={{ background: '#c8ff00' }}>N</div>
                        <span className="text-xs text-white/30 font-medium font-display">NeoTravel AI</span>
                      </div>
                    )}
                    {message.parts.map((part, i) => {
                      if (part.type === 'text' && part.text) {
                        return (
                          <div
                            key={i}
                            className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                            style={message.role === 'user'
                              ? { background: '#1e1e1e', color: 'white', borderRadius: '16px 16px 4px 16px' }
                              : { background: '#161616', color: 'rgba(255,255,255,0.8)', border: '1px solid #2a2a2a', borderRadius: '4px 16px 16px 16px' }
                            }
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
                          <div key={i} className="mt-2 text-xs text-white/30 italic flex items-center gap-1.5">
                            <span className="animate-pulse">⏳</span> Calcul du devis…
                          </div>
                        )
                      }
                      if (part.type === 'tool-escalade_humain') {
                        if (part.state === 'output-available') {
                          return <EscaladeCard key={i} output={part.output as { ok: boolean; message: string }} />
                        }
                        return (
                          <div key={i} className="mt-2 text-xs text-white/30 italic flex items-center gap-1.5">
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
                  <div className="rounded-2xl px-4 py-3 flex gap-1" style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '4px 16px 16px 16px' }}>
                    <span className="animate-bounce text-white/30" style={{ animationDelay: '0ms' }}>•</span>
                    <span className="animate-bounce text-white/30" style={{ animationDelay: '150ms' }}>•</span>
                    <span className="animate-bounce text-white/30" style={{ animationDelay: '300ms' }}>•</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="px-6 py-4 shrink-0 border-t" style={{ borderColor: '#1e1e1e' }}>
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ex : Paris → Lyon, 40 passagers, le 15 mars…"
              disabled={status !== 'ready'}
              className="flex-1 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none disabled:opacity-40 transition-all"
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
            />
            <button
              type="submit"
              disabled={status !== 'ready' || !inputValue.trim()}
              className="rounded-2xl px-5 py-3 text-sm font-bold text-black disabled:opacity-40 transition-all shrink-0 font-display"
              style={{ background: '#c8ff00' }}
            >
              ↑
            </button>
          </form>
        </div>
      </main>

      {/* ── Panneau droit ── */}
      <aside className="w-80 flex flex-col shrink-0 border-l" style={{ background: '#0a0a0a', borderColor: '#1e1e1e' }}>

        {/* Header résumé */}
        <div className="px-5 py-5 border-b" style={{ borderColor: '#1e1e1e' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/30 font-display">
              {lastDevis?.passagers ? `${lastDevis.passagers} passagers` : '— passagers'}
            </span>
            <span className="text-xs font-medium text-white/30 font-display">Résumé</span>
          </div>
          <p className="text-2xl font-bold font-display" style={{ color: lastDevis ? '#c8ff00' : 'rgba(255,255,255,0.2)' }}>
            {lastDevis?.prix?.montant_ttc ? `${lastDevis.prix.montant_ttc} €` : '—'}
          </p>
          <p className="text-xs text-white/20 mt-0.5 font-display">Total TTC estimé</p>
        </div>

        {/* Capture IA */}
        <div className="px-5 py-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider font-display">Données captées</p>
            <span className="text-xs text-white/30 font-display">{capturedCount}/{CAPTURE_FIELDS.length}</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full mb-4" style={{ background: '#1e1e1e' }}>
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(capturedCount / CAPTURE_FIELDS.length) * 100}%`, background: '#c8ff00' }}
            />
          </div>

          <div className="space-y-2">
            {CAPTURE_FIELDS.map((field, i) => (
              <div key={field} className="flex items-center gap-2.5 py-1.5">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: captured[i] ? '#c8ff00' : '#2a2a2a' }}
                />
                <span className="text-xs" style={{ color: captured[i] ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)' }}>
                  {field}
                </span>
                {!captured[i] && (
                  <span className="ml-auto text-xs text-white/15 font-display">MISSING</span>
                )}
              </div>
            ))}
          </div>

          {lastDevis && (
            <button
              onClick={downloadPdf}
              disabled={pdfLoading}
              className="mt-6 w-full text-black text-sm font-bold py-3 rounded-xl transition-all disabled:opacity-40 font-display"
              style={{ background: '#c8ff00' }}
            >
              {pdfLoading ? '⏳ Génération…' : '⬇ Générer le devis PDF'}
            </button>
          )}

          {lastDevis && (
            <div className="mt-5 pt-4 space-y-2.5 text-xs" style={{ borderTop: '1px solid #1e1e1e' }}>
              <div className="flex justify-between text-white/30">
                <span className="font-display">Agent</span>
                <span className="text-white/50 font-display">NeoTravel AI v2.1</span>
              </div>
              <div className="flex justify-between text-white/30">
                <span className="font-display">Matrix</span>
                <span className="font-display" style={{ color: '#c8ff00' }}>✓ Loaded</span>
              </div>
              {lastDevis.mode && (
                <div className="flex justify-between text-white/30">
                  <span className="font-display">Mode</span>
                  <span className="font-display" style={{ color: '#c8ff00' }}>✓ {lastDevis.mode}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

    </div>
  )
}
