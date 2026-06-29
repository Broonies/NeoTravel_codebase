import { getSupabaseClient } from "@/lib/supabase/client";

export type StatutData    = { statut: string; count: number }
export type TypeClientData = { type: string; count: number }

export async function getDashboardKPIs() {
  const supabase = getSupabaseClient();

  const [leadsRes, devisRes, demandesRes] = await Promise.all([
    supabase.from("leads").select("id, type_client", { count: "exact" }),
    supabase.from("devis").select("id, statut, montant_ttc, coeff_saisonnalite, coeff_capacite, coeff_delai, nb_relance"),
    supabase.from("demandes").select("id, type_statut, urgence_code, score_completude"),
  ]);

  if (leadsRes.error) throw new Error(leadsRes.error.message);
  if (devisRes.error) throw new Error(devisRes.error.message);
  if (demandesRes.error) throw new Error(demandesRes.error.message);

  const leads    = leadsRes.data   || [];
  const devis    = devisRes.data   || [];
  const demandes = demandesRes.data || [];
  const totalLeads = leadsRes.count || 0;

  const devisAcceptes = devis.filter(d => d.statut === "accepte");
  const devisEnvoyes  = devis.filter(d => d.statut === "envoye");

  const totalCaAccept = devisAcceptes.reduce((s, d) => s + Number(d.montant_ttc || 0), 0);
  const caPotentiel   = devisEnvoyes.reduce((s, d) => s + Number(d.montant_ttc || 0), 0);
  const conversionRate = totalLeads > 0 ? Math.round((devisAcceptes.length / totalLeads) * 100) : 0;
  const totalRelances  = devis.filter(d => (d.nb_relance || 0) > 0).length;

  const hitlCount = demandes.filter(d =>
    d.urgence_code === "DD_PRIORITAIRE" ||
    (d.score_completude !== null && Number(d.score_completude) < 70)
  ).length;

  // Répartition par statut
  const statutsData: StatutData[] = ["brouillon", "envoye", "accepte", "refuse"].map(s => ({
    statut: s,
    count: devis.filter(d => d.statut === s).length,
  }));

  // Répartition par type de client
  const typeCounts: Record<string, number> = {};
  for (const l of leads) {
    const t = (l.type_client as string) || "Non renseigné";
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  }
  const typeClientData: TypeClientData[] = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Funnel commercial
  const tsCount = (s: string) => demandes.filter(d => d.type_statut === s).length;
  const funnelData = [
    { name: "Leads entrants",  value: totalLeads,                                                                fill: "#1e1e32" },
    { name: "Qualifiés (IA)",  value: tsCount("demande_qualifiee") + tsCount("nouvelle_demande"),                fill: "#5a2bd9" },
    { name: "Devis envoyés",   value: devisEnvoyes.length,                                                      fill: "#8d6ee8" },
    { name: "Acceptés",        value: devisAcceptes.length,                                                     fill: "#c8db1a" },
  ];

  // Coefficients moyens
  const avg = (key: "coeff_saisonnalite" | "coeff_capacite" | "coeff_delai") => {
    if (!devis.length) return 1;
    return Number((devis.reduce((s, d) => s + Number(d[key] || 1), 0) / devis.length).toFixed(2));
  };
  const radarData = [
    { name: "Saisonnalité", value: avg("coeff_saisonnalite") },
    { name: "Capacité",     value: avg("coeff_capacite") },
    { name: "Délai",        value: avg("coeff_delai") },
  ];

  return {
    totalLeads,
    totalDevis: devis.length,
    totalCaAccept,
    caPotentiel,
    conversionRate,
    totalRelances,
    hitlCount,
    statutsData,
    typeClientData,
    funnelData,
    radarData,
  };
}
