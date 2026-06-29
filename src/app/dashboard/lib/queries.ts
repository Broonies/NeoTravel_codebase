// app/dashboard/lib/queries.ts
import { createClient } from "@/lib/supabase/server";

export async function getDashboardKPIs() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Extraction parallèle pour optimiser le chargement
  const [leadsRes, devisRes, demandesRes, relancesRes] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact" }),
    supabase
      .from("devis")
      .select(
        "id, statut, montant_ttc, coeff_saisonnalite, coeff_capacite, coeff_delai, date_envoi",
      ),
    supabase.from("demandes").select("id, type_statut, score_completude"),
    supabase
      .from("devis")
      .select(
        "id, montant_ttc, prochaine_relance, statut, demandes(ville_depart, ville_arrivee, leads(prenom, nom, societe))",
      )
      .eq("statut", "envoye")
      .lte("prochaine_relance", new Date().toISOString())
      .order("prochaine_relance", { ascending: true })
      .limit(5),
  ]);

  if (leadsRes.error) throw new Error(leadsRes.error.message);
  if (devisRes.error) throw new Error(devisRes.error.message);

  const totalLeads = leadsRes.count || 0;
  const validDevis = devisRes.data || [];
  const devisAcceptes = validDevis.filter((d) => d.statut === "accepte");

  // KPIs de base
  const totalCaAccept = devisAcceptes.reduce(
    (acc, curr) => acc + Number(curr.montant_ttc || 0),
    0,
  );
  const conversionRate =
    totalLeads > 0 ? Math.round((devisAcceptes.length / totalLeads) * 100) : 0;

  // Funnel
  const typeStatutCount = (statut: string) =>
    demandesRes.data?.filter((d) => d.type_statut === statut).length || 0;
  const funnelData = [
    { name: "Nouveaux", value: typeStatutCount("nouveau"), fill: "#4A5568" },
    { name: "Qualifiés", value: typeStatutCount("qualifie"), fill: "#319795" },
    {
      name: "Devis Envoyés",
      value: validDevis.filter((d) => d.statut === "envoye").length,
      fill: "#E8872A",
    },
    { name: "Acceptés", value: devisAcceptes.length, fill: "#00B4A0" },
  ];

  // Radar des coefficients moyens
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
    { name: "Capacité", value: avgCoeff("coeff_capacite") },
    { name: "Urgence", value: avgCoeff("coeff_delai") },
  ];

  return {
    totalLeads,
    totalCaAccept,
    conversionRate,
    funnelData,
    radarData,
    alertesRelances: relancesRes.data || [],
  };
}
