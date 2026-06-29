// src/app/dashboard/lib/queries.ts
import { getSupabaseClient } from "@/lib/supabase/client";

export async function getDashboardKPIs() {
  const supabase = getSupabaseClient();

  // Extraction parallèle globale sur l'ensemble de la base
  const [leadsRes, devisRes, demandesRes] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact" }),
    supabase
      .from("devis")
      .select(
        "id, statut, montant_ttc, coeff_saisonnalite, coeff_capacite, coeff_delai",
      ),
    supabase.from("demandes").select("id, type_statut"),
  ]);

  if (leadsRes.error) throw new Error(leadsRes.error.message);
  if (devisRes.error) throw new Error(devisRes.error.message);
  if (demandesRes.error) throw new Error(demandesRes.error.message);

  const totalLeads = leadsRes.count || 0;
  const validDevis = devisRes.data || [];
  const devisAcceptes = validDevis.filter((d) => d.statut === "accepte");

  // Calcul du Chiffre d'Affaires et Taux de Conversion global
  const totalCaAccept = devisAcceptes.reduce(
    (acc, curr) => acc + Number(curr.montant_ttc || 0),
    0,
  );
  const conversionRate =
    totalLeads > 0 ? Math.round((devisAcceptes.length / totalLeads) * 100) : 0;

  // Construction du Funnel Commercial Complet
  const typeStatutCount = (statut: string) =>
    demandesRes.data?.filter((d) => d.type_statut === statut).length || 0;
  const funnelData = [
    { name: "1. Nouveaux Leads", value: totalLeads, fill: "#4A5568" },
    {
      name: "2. Qualifiés (IA)",
      value:
        typeStatutCount("demande_qualifiee") +
        typeStatutCount("nouvelle_demande"),
      fill: "#319795",
    },
    {
      name: "3. Devis Envoyés",
      value: validDevis.filter((d) => d.statut === "envoye").length,
      fill: "#E8872A",
    },
    { name: "4. Acceptés", value: devisAcceptes.length, fill: "#00B4A0" },
  ];

  // Moyenne des multiplicateurs du moteur calculer_devis() pour audit
  const avgCoeff = (
    key: "coeff_saisonnalite" | "coeff_capacite" | "coeff_delai",
  ) => {
    if (validDevis.length === 0) return 1;
    return Number(
      (
        validDevis.reduce((acc, curr) => acc + Number(curr[key] || 1), 0) /
        validDevis.length
      ).toFixed(2),
    );
  };

  const radarData = [
    { name: "Saisonnalité", value: avgCoeff("coeff_saisonnalite") },
    { name: "Capacité Vol.", value: avgCoeff("coeff_capacite") },
    { name: "Urgence Délai", value: avgCoeff("coeff_delai") },
  ];

  return {
    totalLeads,
    totalCaAccept,
    conversionRate,
    funnelData,
    radarData,
  };
}
