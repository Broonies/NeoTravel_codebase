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

function pct(v: number) { return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(0)} %` }

function CoeffSpan({ v }: { v: number }) {
  const cls = v > 0 ? 'text-rose-500' : v < 0 ? 'text-emerald-600' : ''
  const style = v === 0 ? { color: '#a8a8ba' } : {}
  return <span className={cls} style={style}>{pct(v)}</span>
}

// ── DevisCard ─────────────────────────────────────────────────────────────────

function DevisCard({ output }: { output: DevisOutput }) {
  if (!output.ok) return (
    <div className="mt-3 p-4 text-sm" style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '14px', color: '#b91c1c' }}>
      <span className="font-semibold">Erreur : </span>{output.error}{output.reason ? ` — ${output.reason}` : ''}
    </div>
  )

  const s = output.supplements ?? { peages: 0, nuit_chauffeur: 0, guide: 0 }
  const c = output.coefficients ?? { saisonnalite: 0, capacite: 0, delai: 0 }
  const p = output.prix ?? { base: 0, montant_ht: 0, montant_tva: 0, montant_ttc: 0 }

  return (
    <div className="mt-3 overflow-hidden text-sm" style={{ background: '#fff', border: '1px solid #e6e6ee', borderRadius: '14px', boxShadow: '0 18px 40px -18px rgba(30,30,50,.22)' }}>
      <div className="px-4 py-3" style={{ background: '#5a2bd9' }}>
        <div className="font-semibold text-white text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {output.trajet?.ville_depart} → {output.trajet?.ville_arrivee}
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>Devis NeoTravel</div>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Distance', value: `${output.trajet?.km} km` },
            { label: 'Passagers', value: `${output.passagers}` },
            (output.dates?.nb_nuits ?? 0) > 0
              ? { label: 'Durée', value: `${output.dates?.nb_nuits} nuit${(output.dates?.nb_nuits ?? 0) > 1 ? 's' : ''}` }
              : { label: 'Type', value: output.aller_retour ? 'A/R' : 'Aller simple' },
          ].map(({ label, value }) => (
            <div key={label} className="p-2.5 text-center" style={{ background: '#f8f8fc', borderRadius: '8px' }}>
              <div className="text-xs" style={{ color: '#6e6e82' }}>{label}</div>
              <div className="font-semibold text-xs mt-0.5" style={{ color: '#1e1e32', fontFamily: 'Poppins, sans-serif' }}>{value}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 text-xs">
          {[
            { label: 'Prix de base',      val: <span style={{ color: '#1e1e32', fontWeight: 600 }}>{p.base} €</span> },
            { label: 'Saisonnalité',      val: <CoeffSpan v={c.saisonnalite} /> },
            ...(c.capacite !== 0 ? [{ label: 'Capacité', val: <CoeffSpan v={c.capacite} /> }] : []),
            { label: 'Délai réservation', val: <CoeffSpan v={c.delai} /> },
            ...(s.peages > 0         ? [{ label: 'Péages',          val: <span style={{ color: '#36364f' }}>+{s.peages} €</span> }] : []),
            ...(s.nuit_chauffeur > 0 ? [{ label: 'Nuit chauffeur',  val: <span style={{ color: '#36364f' }}>+{s.nuit_chauffeur} €</span> }] : []),
            ...(s.guide > 0          ? [{ label: 'Guide',            val: <span style={{ color: '#36364f' }}>+{s.guide} €</span> }] : []),
          ].map(({ label, val }) => (
            <div key={label} className="flex justify-between" style={{ color: '#6e6e82' }}>
              <span>{label}</span>{val}
            </div>
          ))}
        </div>
        <div className="pt-3 space-y-1 text-xs" style={{ borderTop: '1px solid #e6e6ee' }}>
          <div className="flex justify-between" style={{ color: '#6e6e82' }}><span>Montant HT</span><span>{p.montant_ht} €</span></div>
          <div className="flex justify-between" style={{ color: '#6e6e82' }}><span>TVA (10 %)</span><span>{p.montant_tva} €</span></div>
          <div className="flex justify-between font-bold pt-1" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', color: '#1e1e32' }}>
            <span>Total TTC</span>
            <span style={{ background: '#c8db1a', color: '#1e1e32', padding: '2px 10px', borderRadius: '999px' }}>{p.montant_ttc} €</span>
          </div>
          {output.mode && <p className="text-right" style={{ color: '#a8a8ba', fontSize: '10px' }}>{output.mode}</p>}
        </div>
      </div>
    </div>
  )
}

function EscaladeCard({ output }: { output: { ok: boolean; message: string } }) {
  return (
    <div className="mt-3 p-4 text-sm" style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', color: '#92400e' }}>
      <span className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>🚨 Escalade — </span>
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
  { label: 'Paris → Lyon',     date: '12 juin', img: 'https://picsum.photos/seed/paris/80/55'     },
  { label: 'Marseille → Nice', date: '8 juin',  img: 'https://picsum.photos/seed/marseille/80/55' },
  { label: 'Paris → Bordeaux', date: '3 juin',  img: 'https://picsum.photos/seed/bordeaux/80/55'  },
  { label: 'Lyon → Barcelone', date: '28 mai',  img: 'https://picsum.photos/seed/barcelona/80/55' },
]

const CAPTURE_FIELDS = [
  "Ville de départ", "Ville d'arrivée", "Date de départ",
  "Nombre de passagers", "Aller / retour", "Hébergement nuit", "Guide touristique",
]

// ── ChatUI ────────────────────────────────────────────────────────────────────

export default function ChatUI() {
  const [inputValue, setInputValue]   = useState('')
  const [lastDevis, setLastDevis]     = useState<DevisOutput | null>(null)
  const [pdfLoading, setPdfLoading]   = useState(false)
  const [pdfUrl, setPdfUrl]           = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [panelOpen, setPanelOpen]     = useState(false)
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
    setSidebarOpen(false)
  }

  async function generatePdf() {
    if (!lastDevis) return
    setPdfLoading(true)
    setPdfUrl(null)
    try {
      const res  = await fetch('/api/devis/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lastDevis) })
      const json = await res.json()
      if (json.url) setPdfUrl(json.url)
    } finally { setPdfLoading(false) }
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

  // Contenu panneau droit partagé desktop + drawer mobile
  function PanelContent() {
    return (
      <>
        <div className="px-5 py-5" style={{ borderBottom: '1px solid #e6e6ee' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: '#6e6e82', fontFamily: 'Inter, sans-serif' }}>
              {lastDevis?.passagers ? `${lastDevis.passagers} passagers` : '— passagers'}
            </span>
            <span className="text-xs font-semibold" style={{ color: '#6e6e82', fontFamily: 'Inter, sans-serif' }}>Résumé</span>
          </div>
          {lastDevis?.prix?.montant_ttc ? (
            <div className="py-3 text-center font-bold text-xl mt-1" style={{ background: '#c8db1a', color: '#1e1e32', borderRadius: '8px', fontFamily: 'Poppins, sans-serif' }}>
              {lastDevis.prix.montant_ttc} €
              <div className="text-xs font-normal mt-0.5" style={{ color: '#4a5400', fontFamily: 'Inter, sans-serif' }}>Tarif TTC estimé</div>
            </div>
          ) : (
            <p className="text-2xl font-bold mt-1" style={{ color: '#a8a8ba', fontFamily: 'Poppins, sans-serif' }}>—</p>
          )}
        </div>
        <div className="px-5 py-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase" style={{ color: '#36364f', fontFamily: 'Inter, sans-serif', letterSpacing: '0.14em' }}>Données captées</p>
            <span className="text-xs font-semibold px-2 py-0.5" style={{ background: '#f3eefc', color: '#5a2bd9', border: '1px solid #e7defb', borderRadius: '999px', fontFamily: 'Inter, sans-serif' }}>
              {capturedCount}/{CAPTURE_FIELDS.length}
            </span>
          </div>
          <div className="w-full h-1.5 mb-4" style={{ background: '#e6e6ee', borderRadius: '999px' }}>
            <div className="h-1.5 transition-all duration-500" style={{ width: `${(capturedCount / CAPTURE_FIELDS.length) * 100}%`, background: '#c8db1a', borderRadius: '999px' }} />
          </div>
          <div className="space-y-2">
            {CAPTURE_FIELDS.map((field, i) => (
              <div key={field} className="flex items-center gap-2.5 py-1">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: captured[i] ? '#5a2bd9' : '#e6e6ee' }} />
                <span className="text-xs" style={{ color: captured[i] ? '#1e1e32' : '#a8a8ba', fontFamily: 'Inter, sans-serif', fontWeight: captured[i] ? 500 : 400 }}>{field}</span>
                {!captured[i] && <span className="ml-auto text-xs font-semibold" style={{ color: '#e6e6ee', letterSpacing: '0.08em' }}>—</span>}
              </div>
            ))}
          </div>
          {lastDevis && (
            <div className="mt-6 space-y-2">
              {/* Générer si pas encore de PDF */}
              {!pdfUrl && (
                <button
                  onClick={generatePdf}
                  disabled={pdfLoading}
                  className="w-full font-semibold py-3 transition-all disabled:opacity-40 hover:-translate-y-px"
                  style={{ background: '#5a2bd9', color: '#fff', borderRadius: '999px', fontFamily: 'Poppins, sans-serif', fontSize: '14px', boxShadow: '0 10px 22px -10px #5a2bd9' }}
                >
                  {pdfLoading ? '⏳ Génération…' : '⬇ Générer le devis PDF'}
                </button>
              )}

              {/* Une fois l'URL disponible : deux boutons inversés */}
              {pdfUrl && (
                <>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full font-semibold py-3 flex items-center justify-center gap-2 transition-all hover:-translate-y-px text-sm"
                    style={{ background: '#fff', color: '#5a2bd9', border: '1.5px solid #5a2bd9', borderRadius: '999px', fontFamily: 'Poppins, sans-serif' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-3-9v9m0 0l3-3m-3 3l-3-3" /></svg>
                    Consulter en ligne
                  </a>
                  <a
                    href={pdfUrl}
                    download
                    className="w-full font-semibold py-3 flex items-center justify-center gap-2 transition-all hover:-translate-y-px text-sm"
                    style={{ background: '#5a2bd9', color: '#fff', borderRadius: '999px', fontFamily: 'Poppins, sans-serif', boxShadow: '0 10px 22px -10px #5a2bd9' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Télécharger
                  </a>
                  <button
                    onClick={generatePdf}
                    disabled={pdfLoading}
                    className="w-full text-xs py-1.5 transition-colors hover:underline disabled:opacity-40"
                    style={{ color: '#a8a8ba', fontFamily: 'Inter, sans-serif' }}
                  >
                    {pdfLoading ? '⏳ Regénération…' : '↻ Regénérer'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden relative" style={{ background: '#f8f8fc' }}>

      {/* Overlay mobile */}
      {(sidebarOpen || panelOpen) && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => { setSidebarOpen(false); setPanelOpen(false) }}
        />
      )}

      {/* ── Sidebar gauche ── */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto w-72 flex flex-col shrink-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: '#1e1e32', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-9 h-9 flex items-center justify-center font-bold text-sm shrink-0" style={{ background: '#c8db1a', color: '#1e1e32', borderRadius: '12px', fontFamily: 'Poppins, sans-serif' }}>N</div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm" style={{ fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em' }}>Neo<span style={{ color: '#c8db1a' }}>Travel</span></p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif' }}>B2B Platform</p>
          </div>
          {/* Fermer drawer sur mobile */}
          <button
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-full"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold" style={{ background: '#5a2bd9', color: '#fff', borderRadius: '999px', fontFamily: 'Poppins, sans-serif' }}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            Générateur de devis
          </button>
          {[
            { href: '/devis',     label: 'Formulaire de devis', path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { href: '/dashboard', label: 'Dashboard',           path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          ].map(({ href, label, path }) => (
            <Link key={label} href={href} onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.45)', borderRadius: '999px', fontFamily: 'Inter, sans-serif' }}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} /></svg>
              {label}
            </Link>
          ))}
        </nav>

        {/* Récents */}
        <div className="px-5 pt-2 pb-2">
          <p className="text-xs font-semibold uppercase" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.14em' }}>Récents</p>
        </div>
        <div className="px-3 space-y-1 flex-1 overflow-y-auto">
          {RECENT_TRIPS.map((trip) => (
            <button key={trip.label} className="w-full flex items-center gap-3 px-2 py-2 text-left" style={{ borderRadius: '12px' }}>
              <img src={trip.img} alt={trip.label} className="w-11 h-8 object-cover shrink-0" style={{ borderRadius: '8px' }} />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>{trip.label}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter, sans-serif' }}>{trip.date}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => { window.location.reload(); setSidebarOpen(false) }}
            className="w-full text-sm font-semibold py-2.5 transition-all hover:bg-white/20 hover:text-white hover:border-white/30 hover:-translate-y-px active:translate-y-0"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '999px', fontFamily: 'Poppins, sans-serif' }}
          >
            + Nouvelle conversation
          </button>
        </div>
      </aside>

      {/* ── Centre : Chat ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">

        {/* Header */}
        <header className="px-4 sm:px-6 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid #e6e6ee' }}>
          <div className="flex items-center gap-3">
            {/* Hamburger mobile */}
            <button className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100" onClick={() => setSidebarOpen(true)} style={{ color: '#36364f' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h1 className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '15px', color: '#1e1e32', letterSpacing: '-0.02em' }}>Nouvelle conversation</h1>
              <p className="hidden sm:block text-xs mt-0.5" style={{ color: '#6e6e82', fontFamily: 'Inter, sans-serif' }}>Assistant devis autocar · B2B</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status !== 'ready' && (
              <span className="hidden sm:flex text-xs items-center gap-1.5" style={{ color: '#6e6e82', fontFamily: 'Inter, sans-serif' }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#5a2bd9' }} />
                {status === 'streaming' ? 'En cours…' : 'Envoi…'}
              </span>
            )}
            {/* Bouton résumé mobile */}
            {lastDevis?.prix?.montant_ttc && (
              <button
                className="lg:hidden flex items-center gap-1.5 text-xs font-bold px-3 py-1.5"
                style={{ background: '#c8db1a', color: '#1e1e32', borderRadius: '999px', fontFamily: 'Poppins, sans-serif' }}
                onClick={() => setPanelOpen(true)}
              >
                {lastDevis.prix.montant_ttc} €
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-4xl mx-auto">

            {isEmpty && (
              <div>
                <p className="text-center text-sm mb-6" style={{ color: '#6e6e82', fontFamily: 'Inter, sans-serif' }}>Choisissez une destination ou décrivez votre trajet</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.city}
                      onClick={() => sendMessage({ text: `${ex.city}, ${ex.hint}` })}
                      className="group relative overflow-hidden cursor-pointer focus:outline-none transition-all hover:-translate-y-1"
                      style={{ borderRadius: '14px', boxShadow: '0 18px 40px -18px rgba(30,30,50,.18)', border: '1.5px solid #e6f06b' }}
                    >
                      <img src={ex.img} alt={ex.city} className="w-full h-24 sm:h-28 object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 text-left">
                        <p className="text-white font-semibold text-xs leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>{ex.city}</p>
                        <p className="text-xs hidden sm:block" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter, sans-serif' }}>{ex.hint}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-5">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[88%] sm:max-w-[80%]">
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-5 h-5 flex items-center justify-center text-white text-xs font-bold" style={{ background: '#5a2bd9', borderRadius: '6px', fontFamily: 'Poppins, sans-serif' }}>N</div>
                        <span className="text-xs font-medium" style={{ color: '#6e6e82', fontFamily: 'Inter, sans-serif' }}>NeoTravel AI</span>
                      </div>
                    )}
                    {message.parts.map((part, i) => {
                      if (part.type === 'text' && part.text) return (
                        <div key={i} className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap" style={message.role === 'user'
                          ? { background: '#5a2bd9', color: '#fff', borderRadius: '18px 18px 4px 18px', fontFamily: 'Inter, sans-serif', boxShadow: '0 10px 22px -10px #5a2bd9' }
                          : { background: '#f8f8fc', color: '#36364f', border: '1px solid #e6e6ee', borderRadius: '4px 18px 18px 18px', fontFamily: 'Inter, sans-serif' }
                        }>{part.text}</div>
                      )
                      if (part.type === 'tool-calculer_devis') {
                        if (part.state === 'output-available') return <DevisCard key={i} output={part.output as DevisOutput} />
                        return <div key={i} className="mt-2 text-xs italic flex items-center gap-1.5" style={{ color: '#6e6e82', fontFamily: 'Inter, sans-serif' }}><span className="animate-pulse">⏳</span> Calcul…</div>
                      }
                      if (part.type === 'tool-escalade_humain') {
                        if (part.state === 'output-available') return <EscaladeCard key={i} output={part.output as { ok: boolean; message: string }} />
                        return <div key={i} className="mt-2 text-xs italic flex items-center gap-1.5" style={{ color: '#6e6e82', fontFamily: 'Inter, sans-serif' }}><span className="animate-pulse">⏳</span> Escalade…</div>
                      }
                      return null
                    })}
                  </div>
                </div>
              ))}
              {status === 'submitted' && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 flex gap-1" style={{ background: '#f8f8fc', border: '1px solid #e6e6ee', borderRadius: '4px 18px 18px 18px' }}>
                    <span className="animate-bounce" style={{ color: '#a8a8ba', animationDelay: '0ms' }}>•</span>
                    <span className="animate-bounce" style={{ color: '#a8a8ba', animationDelay: '150ms' }}>•</span>
                    <span className="animate-bounce" style={{ color: '#a8a8ba', animationDelay: '300ms' }}>•</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="px-4 sm:px-6 py-4 shrink-0 bg-white" style={{ borderTop: '1px solid #e6e6ee' }}>
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ex : Paris → Lyon, 40 passagers…"
              disabled={status !== 'ready'}
              className="flex-1 text-sm disabled:opacity-40"
              style={{ background: '#f8f8fc', border: '1px solid #e6e6ee', borderRadius: '999px', padding: '12px 16px sm:20px', color: '#1e1e32', fontFamily: 'Inter, sans-serif', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={status !== 'ready' || !inputValue.trim()}
              className="font-semibold text-white text-sm px-5 sm:px-6 py-3 disabled:opacity-40 shrink-0"
              style={{ background: '#5a2bd9', borderRadius: '999px', fontFamily: 'Poppins, sans-serif', boxShadow: '0 10px 22px -10px #5a2bd9' }}
            >
              <span className="hidden sm:inline">Envoyer</span>
              <svg className="sm:hidden w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      </main>

      {/* ── Panneau droit — desktop ── */}
      <aside className="hidden lg:flex lg:w-80 flex-col shrink-0" style={{ background: '#f8f8fc', borderLeft: '1px solid #e6e6ee' }}>
        <PanelContent />
      </aside>

      {/* ── Panneau droit — drawer mobile ── */}
      <div
        className={`fixed lg:hidden inset-y-0 right-0 z-50 w-80 max-w-[90vw] flex flex-col transition-transform duration-300 ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: '#f8f8fc', borderLeft: '1px solid #e6e6ee' }}
      >
        <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid #e6e6ee' }}>
          <p className="font-semibold text-sm" style={{ fontFamily: 'Poppins, sans-serif', color: '#1e1e32' }}>Résumé du devis</p>
          <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors" style={{ color: '#6e6e82' }} onClick={() => setPanelOpen(false)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <PanelContent />
      </div>

    </div>
  )
}
