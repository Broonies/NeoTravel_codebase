// app/dashboard/components/RelanceAlerts.tsx
"use client";

export function RelanceAlerts({ alerts }: { alerts: any[] }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="mt-8 rounded-xl border border-red-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex justify-between items-center">
        <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide">
          🚨 Devis à relancer d'urgence
        </h3>
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
          {alerts.length} en attente
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {alerts.map((alert) => {
          const lead = alert.demandes?.leads;
          const name = lead
            ? `${lead.prenom} ${lead.nom} ${lead.societe ? `(${lead.societe})` : ""}`
            : "Client Inconnu";
          return (
            <div
              key={alert.id}
              className="p-4 px-6 flex justify-between items-center hover:bg-gray-50"
            >
              <div>
                <p className="font-semibold text-gray-800">{name}</p>
                <p className="text-xs text-gray-500">
                  {alert.demandes?.ville_depart} →{" "}
                  {alert.demandes?.ville_arrivee}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#E8872A]">
                  {alert.montant_ttc} €
                </p>
                <p className="text-xs text-red-500">
                  Échéance :{" "}
                  {new Date(alert.prochaine_relance).toLocaleString("fr-FR")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
