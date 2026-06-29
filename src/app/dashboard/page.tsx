import Link from "next/link";
import { getDossiersUrgents, getRelancesActives, type DossierUrgent, type RelanceActive } from "./actions";
import { getDashboardKPIs } from "./lib/queries";
import { DashboardCharts } from "./components/DashboardCharts";
import { TabNav } from "./components/TabNav";

// ── Helpers ───────────────────────────────────────────────────────────────────

const eur = (v: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

const fdate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent, icon }: {
  label: string; value: string; sub?: string; accent?: string; icon: React.ReactNode;
}) {
  return (
    <div
      className="bg-white p-5 flex flex-col gap-3"
      style={{ border: "1px solid #e6e6ee", borderRadius: "22px", boxShadow: "0 18px 40px -18px rgba(30,30,50,.12)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase" style={{ fontFamily: "Inter, sans-serif", color: "#6e6e82", letterSpacing: "0.12em" }}>
          {label}
        </p>
        <div
          className="w-9 h-9 flex items-center justify-center shrink-0"
          style={{ background: accent ? `${accent}18` : "#f3eefc", borderRadius: "12px", color: accent || "#5a2bd9" }}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className="font-bold leading-none" style={{ fontFamily: "Poppins, sans-serif", fontSize: "26px", color: accent || "#1e1e32" }}>
          {value}
        </p>
        {sub && <p className="mt-1.5 text-xs" style={{ fontFamily: "Inter, sans-serif", color: "#6e6e82" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Verification Card (dossiers urgents) ──────────────────────────────────────

const URGENCE_CFG = {
  DD_PRIORITAIRE: { label: "Prioritaire", dot: "#ef4444", bg: "#fff5f5", border: "#fecaca", text: "#e11d48" },
  DD_URGENT:      { label: "Urgent",      dot: "#f97316", bg: "#fff7ed", border: "#fed7aa", text: "#f97316" },
};

function VerifCard({ d }: { d: DossierUrgent }) {
  const cfg = URGENCE_CFG[d.urgence_code] ?? URGENCE_CFG.DD_URGENT;
  return (
    <Link
      href={`/dashboard/dossier/${d.demande_id}`}
      className="flex items-center gap-4 p-4 bg-white transition-all hover:-translate-y-0.5"
      style={{ border: `1px solid ${cfg.border}`, borderRadius: "14px", boxShadow: "0 8px 20px -8px rgba(30,30,50,.08)" }}
    >
      <div className="w-1.5 h-12 shrink-0" style={{ background: cfg.dot, borderRadius: "999px" }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.text, fontFamily: "Inter, sans-serif", letterSpacing: "0.06em" }}
          >
            {cfg.label}
          </span>
          <span className="text-xs" style={{ color: "#6e6e82", fontFamily: "Inter, sans-serif" }}>
            Départ : {fdate(d.date_depart)}
          </span>
        </div>
        <p className="font-semibold text-sm truncate" style={{ fontFamily: "Poppins, sans-serif", color: "#1e1e32" }}>
          {d.ville_depart} → {d.ville_arrivee}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ fontFamily: "Inter, sans-serif", color: "#6e6e82" }}>
          {d.lead.prenom} {d.lead.nom} · {d.nb_passagers} passagers
        </p>
      </div>
      {d.score_completude !== null && (
        <div className="shrink-0 text-center">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs"
            style={{
              background: d.score_completude >= 70 ? "#f3eefc" : "#fff5f5",
              color:      d.score_completude >= 70 ? "#5a2bd9" : "#e11d48",
              border:     `2px solid ${d.score_completude >= 70 ? "#e7defb" : "#fecaca"}`,
              fontFamily: "Poppins, sans-serif",
            }}
          >
            {d.score_completude}%
          </div>
          <p className="text-xs mt-1" style={{ color: "#a8a8ba", fontFamily: "Inter, sans-serif" }}>complétude</p>
        </div>
      )}
      <svg className="w-4 h-4 shrink-0" style={{ color: "#a8a8ba" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

// ── Incomplete Row (relances = devis pas encore conclus) ──────────────────────

function IncompleteRow({ r }: { r: RelanceActive }) {
  return (
    <Link
      href={`/dashboard/dossier/${r.demande_id}`}
      className="flex items-center gap-4 px-5 py-4 transition-all hover:bg-gray-50"
      style={{ borderBottom: "1px solid #e6e6ee" }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
        style={{
          background: r.nb_relance >= 3 ? "#fff5f5" : r.nb_relance === 2 ? "#fff7ed" : "#f3eefc",
          color:      r.nb_relance >= 3 ? "#e11d48" : r.nb_relance === 2 ? "#f97316" : "#5a2bd9",
          border:     `1.5px solid ${r.nb_relance >= 3 ? "#fecaca" : r.nb_relance === 2 ? "#fed7aa" : "#e7defb"}`,
          fontFamily: "Poppins, sans-serif",
        }}
      >
        {r.nb_relance}×
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ fontFamily: "Poppins, sans-serif", color: "#1e1e32" }}>
          {r.ville_depart} → {r.ville_arrivee}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ fontFamily: "Inter, sans-serif", color: "#6e6e82" }}>
          {r.lead.prenom} {r.lead.nom}{r.lead.societe ? ` · ${r.lead.societe}` : ""}
          {r.date_depart ? ` · Départ ${fdate(r.date_depart)}` : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-sm" style={{ fontFamily: "Poppins, sans-serif", color: "#1e1e32" }}>
          {eur(r.montant_ttc)}
        </p>
        {r.prochaine_relance && (
          <p className="text-xs mt-0.5" style={{ fontFamily: "Inter, sans-serif", color: "#a8a8ba" }}>
            Relance : {fdate(r.prochaine_relance)}
          </p>
        )}
      </div>
      <svg className="w-4 h-4 shrink-0" style={{ color: "#a8a8ba" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

// ── Empty ─────────────────────────────────────────────────────────────────────

function Empty({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 gap-2 text-sm"
      style={{ background: "#f8f8fc", border: "1.5px dashed #e6e6ee", borderRadius: "14px", color: "#a8a8ba", fontFamily: "Inter, sans-serif" }}
    >
      <svg className="w-7 h-7 mb-1" style={{ color: "#e6e6ee" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {label}
    </div>
  );
}

// ── Sous-section dans Notifications ──────────────────────────────────────────

function NotifSection({ title, sub, count, accentColor, children }: {
  title: string; sub: string; count: number; accentColor: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: accentColor }} />
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase" style={{ fontFamily: "Inter, sans-serif", color: accentColor, letterSpacing: "0.12em" }}>{sub}</p>
          <p className="font-bold" style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", color: "#1e1e32" }}>{title}</p>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: count > 0 ? `${accentColor}18` : "#f8f8fc", color: count > 0 ? accentColor : "#a8a8ba", border: `1px solid ${count > 0 ? `${accentColor}40` : "#e6e6ee"}`, fontFamily: "Inter, sans-serif" }}
        >
          {count} dossier{count > 1 ? "s" : ""}
        </span>
      </div>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "overview" } = await searchParams;

  const [kpis, dossiers, relances] = await Promise.all([
    getDashboardKPIs(),
    getDossiersUrgents(),
    getRelancesActives(),
  ]);

  const notifCount = dossiers.length + relances.length;

  return (
    <div className="min-h-screen" style={{ background: "#f8f8fc" }}>

      {/* ── Header ── */}
      <header className="bg-white" style={{ borderBottom: "1px solid #e6e6ee" }}>
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 flex items-center justify-center font-bold text-sm shrink-0 hover:opacity-80 transition-opacity"
              style={{ background: "#c8db1a", color: "#1e1e32", borderRadius: "12px", fontFamily: "Poppins, sans-serif" }}
            >
              N
            </Link>
            <div>
              <p className="font-bold text-sm" style={{ fontFamily: "Poppins, sans-serif", color: "#1e1e32", letterSpacing: "-0.02em" }}>
                Neo<span style={{ color: "#c8db1a" }}>Travel</span>
                <span className="font-normal ml-2" style={{ color: "#6e6e82" }}>— Dashboard</span>
              </p>
              <p className="text-xs" style={{ fontFamily: "Inter, sans-serif", color: "#a8a8ba" }}>
                Pilotage commercial · Supervision IA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="flex items-center gap-1.5 text-xs font-medium px-4 py-2"
              style={{ background: "#f3eefc", color: "#5a2bd9", border: "1px solid #e7defb", borderRadius: "999px", fontFamily: "Inter, sans-serif" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Assistant IA
            </Link>
            <div
              className="flex items-center gap-2 text-xs font-semibold px-3 py-2"
              style={{ background: "#f3eefc", color: "#5a2bd9", border: "1px solid #e7defb", borderRadius: "999px", fontFamily: "Inter, sans-serif" }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#5a2bd9" }} />
              Moteur actif
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="px-8 pb-0">
          <TabNav currentTab={tab} notifCount={notifCount} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">

        {/* ══════════════ TAB : VUE D'ENSEMBLE ══════════════ */}
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <KpiCard
                label="CA signé"
                value={eur(kpis.totalCaAccept)}
                sub={`${eur(kpis.caPotentiel)} en attente`}
                accent="#c8db1a"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <KpiCard
                label="Taux conversion"
                value={`${kpis.conversionRate} %`}
                sub={`${kpis.totalLeads} leads entrants`}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              />
              <KpiCard
                label="Devis gérés"
                value={`${kpis.totalDevis}`}
                sub={`${kpis.totalLeads} demandes reçues`}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              />
              <KpiCard
                label="Relances actives"
                value={`${kpis.totalRelances}`}
                sub="devis avec ≥ 1 relance"
                accent={kpis.totalRelances > 0 ? "#f97316" : undefined}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
              />
              <KpiCard
                label="Vérifications"
                value={`${dossiers.length}`}
                sub="intervention requise"
                accent={dossiers.length > 0 ? "#e11d48" : undefined}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              />
              <KpiCard
                label="Leads totaux"
                value={`${kpis.totalLeads}`}
                sub={`${kpis.typeClientData.length} typologies`}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              />
            </div>

            <DashboardCharts
              funnelData={kpis.funnelData}
              radarData={kpis.radarData}
              statutsData={kpis.statutsData}
              typeClientData={kpis.typeClientData}
            />
          </>
        )}

        {/* ══════════════ TAB : NOTIFICATIONS ══════════════ */}
        {tab === "notifications" && (
          <div className="space-y-10">
            <div>
              <p className="text-xs font-semibold uppercase" style={{ fontFamily: "Inter, sans-serif", color: "#6e6e82", letterSpacing: "0.14em" }}>
                Alertes
              </p>
              <h2 className="font-bold mt-0.5" style={{ fontFamily: "Poppins, sans-serif", fontSize: "22px", color: "#1e1e32" }}>
                Notifications
              </h2>
              <p className="mt-1 text-sm" style={{ fontFamily: "Inter, sans-serif", color: "#6e6e82" }}>
                {notifCount > 0
                  ? `${notifCount} dossier${notifCount > 1 ? "s" : ""} nécessitent votre attention.`
                  : "Aucune action requise pour le moment."}
              </p>
            </div>

            {/* ── Demandes de vérification ── */}
            <NotifSection
              title="Demandes de vérification"
              sub="Intervention humaine requise"
              count={dossiers.length}
              accentColor="#e11d48"
            >
              {dossiers.length === 0 ? (
                <Empty label="Aucune demande de vérification en cours." />
              ) : (
                <div className="space-y-3">
                  {dossiers.map(d => <VerifCard key={d.demande_id} d={d} />)}
                </div>
              )}
            </NotifSection>

            {/* Séparateur */}
            <div style={{ borderTop: "1px solid #e6e6ee" }} />

            {/* ── Demandes incomplètes ── */}
            <NotifSection
              title="Demandes incomplètes"
              sub="Devis en attente de finalisation"
              count={relances.length}
              accentColor="#f97316"
            >
              {relances.length === 0 ? (
                <Empty label="Aucune demande incomplète en attente." />
              ) : (
                <div
                  className="bg-white overflow-hidden"
                  style={{ border: "1px solid #e6e6ee", borderRadius: "18px", boxShadow: "0 18px 40px -18px rgba(30,30,50,.12)" }}
                >
                  <div
                    className="px-5 py-3 text-xs font-semibold uppercase"
                    style={{
                      background: "#f8f8fc",
                      borderBottom: "1px solid #e6e6ee",
                      fontFamily: "Inter, sans-serif",
                      color: "#6e6e82",
                      letterSpacing: "0.10em",
                    }}
                  >
                    Trajet · Client · Relances
                  </div>
                  <div>
                    {relances.map(r => <IncompleteRow key={r.devis_id} r={r} />)}
                  </div>
                </div>
              )}
            </NotifSection>
          </div>
        )}

      </div>
    </div>
  );
}
