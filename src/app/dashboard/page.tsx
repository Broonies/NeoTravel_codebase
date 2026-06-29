import Link from "next/link";
import { getDossiersUrgents, type DossierUrgent } from "./actions";
import { DashboardCharts } from "./components/DashboardCharts";
import { RelanceAlerts } from "./components/RelanceAlerts";

const URGENCE_CONFIG = {
  DD_PRIORITAIRE: {
    label: "🔴 PRIORITAIRE",
    bg: "bg-red-50",
    border: "border-red-300",
    badge: "bg-red-100 text-red-700",
    desc: "< 48h",
  },
  DD_URGENT: {
    label: "🟠 URGENT",
    bg: "bg-orange-50",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700",
    desc: "2–7 jours",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildFunnelData(dossiers: DossierUrgent[]) {
  const prioritaire = dossiers.filter(
    (d) => d.urgence_code === "DD_PRIORITAIRE",
  ).length;
  const urgent = dossiers.filter((d) => d.urgence_code === "DD_URGENT").length;

  return [
    { name: "Prioritaires", value: prioritaire, fill: "#EF4444" },
    { name: "Urgents", value: urgent, fill: "#F59E0B" },
    { name: "Total", value: dossiers.length, fill: "#14B8A6" },
  ];
}

function buildRadarData(dossiers: DossierUrgent[]) {
  const totalPassagers = dossiers.reduce(
    (sum, dossier) => sum + dossier.nb_passagers,
    0,
  );
  const averagePassengers = dossiers.length
    ? Math.round(totalPassagers / dossiers.length)
    : 0;

  return [
    {
      name: "Prioritaires",
      value: dossiers.filter((d) => d.urgence_code === "DD_PRIORITAIRE").length,
    },
    {
      name: "Urgents",
      value: dossiers.filter((d) => d.urgence_code === "DD_URGENT").length,
    },
    { name: "Passagers", value: averagePassengers },
  ];
}

function buildAlerts(dossiers: DossierUrgent[]) {
  return dossiers.map((dossier) => ({
    id: dossier.demande_id,
    montant_ttc: dossier.nb_passagers * 150,
    prochaine_relance: dossier.created_at,
    demandes: {
      ville_depart: dossier.ville_depart,
      ville_arrivee: dossier.ville_arrivee,
      leads: {
        prenom: dossier.lead.prenom,
        nom: dossier.lead.nom,
        societe: dossier.lead.email,
      },
    },
  }));
}

export default async function DashboardPage() {
  const dossiers = await getDossiersUrgents();

  const prioritaires = dossiers.filter(
    (d) => d.urgence_code === "DD_PRIORITAIRE",
  );
  const urgents = dossiers.filter((d) => d.urgence_code === "DD_URGENT");
  const funnelData = buildFunnelData(dossiers);
  const radarData = buildRadarData(dossiers);
  const alerts = buildAlerts(dossiers);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center gap-3">
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-bold text-white transition-colors hover:bg-gray-800"
        >
          N
        </Link>
        <div>
          <p className="text-sm font-semibold text-gray-900">Dashboard Sales</p>
          <p className="text-xs text-gray-400">Dossiers urgents · NeoTravel</p>
        </div>
        <span className="ml-auto text-xs text-gray-400">
          {dossiers.length} dossier{dossiers.length > 1 ? "s" : ""} urgent
          {dossiers.length > 1 ? "s" : ""}
        </span>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Dossiers urgents</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {dossiers.length}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Prioritaires</p>
            <p className="mt-2 text-2xl font-semibold text-red-600">
              {prioritaires.length}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Urgents</p>
            <p className="mt-2 text-2xl font-semibold text-orange-600">
              {urgents.length}
            </p>
          </div>
        </div>

        <DashboardCharts funnelData={funnelData} radarData={radarData} />
        <RelanceAlerts alerts={alerts} />

        {dossiers.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white py-20 text-center text-gray-400 shadow-sm">
            <p className="mb-3 text-3xl">✅</p>
            <p className="font-medium text-gray-600">Aucun dossier urgent</p>
            <p className="mt-1 text-sm">
              Toutes les demandes sont dans les délais normaux.
            </p>
          </div>
        )}

        {prioritaires.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-red-600">
              Prioritaire — départ &lt; 48h
            </h2>
            <div className="space-y-3">
              {prioritaires.map((d) => (
                <DossierCard key={d.demande_id} dossier={d} />
              ))}
            </div>
          </section>
        )}

        {urgents.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-orange-600">
              Urgent — départ dans 2–7 jours
            </h2>
            <div className="space-y-3">
              {urgents.map((d) => (
                <DossierCard key={d.demande_id} dossier={d} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function DossierCard({ dossier: d }: { dossier: DossierUrgent }) {
  const cfg = URGENCE_CONFIG[d.urgence_code];
  return (
    <Link
      href={`/dashboard/dossier/${d.demande_id}`}
      className={`block ${cfg.bg} ${cfg.border} border rounded-xl p-4 transition-shadow hover:shadow-sm`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.badge}`}
            >
              {cfg.label}
            </span>
            <span className="text-xs text-gray-500">
              Départ le {formatDate(d.date_depart)}
            </span>
          </div>
          <p className="font-semibold text-gray-900">
            {d.ville_depart} → {d.ville_arrivee}
          </p>
          <p className="text-sm text-gray-600">
            {d.lead.prenom} {d.lead.nom} · {d.nb_passagers} passagers
          </p>
          <p className="text-xs text-gray-400">
            {d.lead.email} · {d.lead.telephone}
          </p>
        </div>
        <span className="mt-1 text-lg text-gray-400">→</span>
      </div>
    </Link>
  );
}
