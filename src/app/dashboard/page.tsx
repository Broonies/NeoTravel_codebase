// src/app/dashboard/page.tsx
import Link from "next/link";
import { getDossiersUrgents, type DossierUrgent } from "./actions";
import { getDashboardKPIs } from "./lib/queries";
import { DashboardCharts } from "./components/DashboardCharts";
import { RelanceAlerts } from "./components/RelanceAlerts";

const URGENCE_CONFIG = {
  DD_PRIORITAIRE: {
    label: "🔴 PRIORITAIRE",
    bg: "bg-red-50/60",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
  },
  DD_URGENT: {
    label: "🟠 URGENT",
    bg: "bg-orange-50/60",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  // Récupération conjointe des données opérationnelles et des KPIs globaux
  const [dossiers, kpis] = await Promise.all([
    getDossiersUrgents(),
    getDashboardKPIs(),
  ]);

  const prioritaires = dossiers.filter(
    (d) => d.urgence_code === "DD_PRIORITAIRE",
  );
  const urgents = dossiers.filter((d) => d.urgence_code === "DD_URGENT");

  // Formatage des alertes pour le composant RelanceAlerts
  const alertsData = dossiers.map((d) => ({
    id: d.demande_id,
    montant_ttc: d.nb_passagers * 180, // Valeur estimée pour affichage dynamique
    prochaine_relance: d.created_at,
    demandes: {
      ville_depart: d.ville_depart,
      ville_arrivee: d.ville_arrivee,
      leads: { prenom: d.lead.prenom, nom: d.lead.nom, societe: d.lead.email },
    },
  }));

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Top Navigation Navigation */}
      <header className="border-b border-gray-200 bg-white px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white transition-transform hover:scale-105"
          >
            N
          </Link>
          <div>
            <h1 className="text-base font-bold text-gray-900">
              Pilotage Commercial & Multiplicateurs
            </h1>
            <p className="text-xs text-gray-400">
              Analyse de performance et supervision de l'IA NeoTravel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Moteur Déterministe Actif
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-8 py-8 space-y-8">
        {/* Résumé des KPIs Haut Niveau (High-Signal summary) */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm border-l-4 border-l-slate-400">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Volume d'Acquisition
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-800 tracking-tight">
              {kpis.totalLeads} leads
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm border-l-4 border-l-[#E8872A]">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Taux de Conversion
            </p>
            <p className="mt-2 text-3xl font-bold text-[#E8872A] tracking-tight">
              {kpis.conversionRate}%
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm border-l-4 border-l-[#00B4A0]">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Chiffre d'Affaires Signé
            </p>
            <p className="mt-2 text-3xl font-bold text-[#00B4A0] tracking-tight">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              }).format(kpis.totalCaAccept)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm border-l-4 border-l-red-500">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Urgences Opérationnelles
            </p>
            <p className="mt-2 text-3xl font-bold text-red-600 tracking-tight">
              {dossiers.length} fiches
            </p>
          </div>
        </div>

        {/* Section Analytique : Pipeline & Radar de Tarification */}
        <DashboardCharts
          funnelData={kpis.funnelData}
          radarData={kpis.radarData}
        />

        {/* Alertes d'action immédiate */}
        <RelanceAlerts alerts={alertsData} />

        {/* Listes de traitement opérationnel par niveau d'urgence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bloc Prioritaire */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-2">
              <span>🔴</span> Prioritaire — Départ imminent (&lt; 48h)
            </h2>
            {prioritaires.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400 bg-white border border-dashed rounded-xl">
                Aucune urgence absolue.
              </div>
            ) : (
              prioritaires.map((d) => (
                <DossierCard key={d.demande_id} dossier={d} />
              ))
            )}
          </section>

          {/* Bloc Urgent */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 flex items-center gap-2">
              <span>🟠</span> Urgent — Départ sous 2 à 7 jours
            </h2>
            {urgents.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400 bg-white border border-dashed rounded-xl">
                Flux sous contrôle.
              </div>
            ) : (
              urgents.map((d) => <DossierCard key={d.demande_id} dossier={d} />)
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function DossierCard({ dossier: d }: { dossier: DossierUrgent }) {
  const cfg = URGENCE_CONFIG[d.urgence_code] || URGENCE_CONFIG.DD_URGENT;
  return (
    <Link
      href={`/dashboard/dossier/${d.demande_id}`}
      className={`block bg-white ${cfg.border} border rounded-xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${cfg.badge}`}
            >
              {cfg.label}
            </span>
            <span className="text-xs text-gray-400">
              Départ : {formatDate(d.date_depart)}
            </span>
          </div>
          <p className="font-bold text-gray-800 text-sm">
            {d.ville_depart} → {d.ville_arrivee}
          </p>
          <p className="text-xs text-gray-500 font-medium">
            {d.lead.prenom} {d.lead.nom} ·{" "}
            <span className="text-slate-700 font-semibold">
              {d.nb_passagers} passagers
            </span>
          </p>
        </div>
        <span className="text-gray-300 font-bold self-center text-lg">→</span>
      </div>
    </Link>
  );
}
