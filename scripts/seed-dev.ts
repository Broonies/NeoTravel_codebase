// app/dashboard/lib/queries.ts
import { createClient } from '@/lib/supabase/server'

export interface DashboardData {
  leadsCountToday: number
  conversionRate: number
  totalCaAccept: number
  avgCompletude: number
  hitlRate: number
  funnelData: { name: string; value: number; fill: string }[]
  radarCoeffs: { name: string; value: number }[]
  pendingRelances: any[]
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Execution des requêtes en parallèle pour optimiser les performances
  const [
    leadsTodayRes,
    allLeadsRes,
    devisRes,
    demandesRes,
    relancesUrgentRes
  ] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00Z`),
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    supabase.from('devis').select('statut, montant_ttc, coeff_saisonnalite, coeff_capacite, coeff_delai'),
    supabase.from('demandes').select('type_statut, score_completude'),
    supabase.from('devis')
      .select(`
        id,
        montant_ttc,
        prochaine_relance,
        demandes (
          ville_depart,
          ville_arrivee,
          leads ( prenom, nom, societe )
        )
      `)
      .eq('statut', 'envoye')
      .lte('prochaine_relance', new Date().toISOString())
      .order('prochaine_relance', { ascending: true })
      .limit(5)
  ])

  // Gestion des erreurs d'infrastructure
  if (leadsTodayRes.error) throw new Error(`Erreur leadsToday: ${leadsTodayRes.error.message}`)
  if (allLeadsRes.error) throw new Error(`Erreur allLeads: ${allLeadsRes.error.message}`)
  if (devisRes.error) throw new Error(`Erreur devis: ${devisRes.error.message}`)
  if (demandesRes.error) throw new Error(`Erreur demandes: ${demandesRes.error.message}`)
  if (relancesUrgentRes.error) throw new Error(`Erreur relancesUrgent: ${relancesUrgentRes.error.message}`)

  const totalLeads = allLeadsRes.count || 0
  const totalDevis = devisRes.data?.length || 0
  const devisAcceptes = devisRes.data?.filter(d => d.statut === 'accepte') || []
  
  // Calculs financiers et taux de conversion
  const conversionRate = totalLeads > 0 ? Math.round((devisAcceptes.length / totalLeads) * 100) : 0
  const totalCaAccept = devisAcceptes.reduce((acc, curr) => acc + Number(curr.montant_ttc || 0), 0)

  // Calculs sur les demandes (Completude & Escalades Humaines / HITL)
  const totalDemandes = demandesRes.data?.length || 0
  const avgCompletude = totalDemandes > 0 
    ? Math.round(demandesRes.data.reduce((acc, curr) => acc + Number(curr.score_completude || 0), 0) / totalDemandes) 
    : 0
  
  const escaladeCount = demandesRes.data?.filter(d => d.type_statut === 'escalade').length || 0
  const hitlRate = totalDemandes > 0 ? Math.round((escaladeCount / totalDemandes) * 100) : 0

  // Construction des données du Funnel Commercial (Recharts)
  const countStatutLeads = (statut: string) => demandesRes.data?.filter(d => d.type_statut === statut).length || 0
  const funnelData = [
    { name: '1. Nouveaux Leads', value: totalLeads, fill: '#4A5568' },
    { name: '2. Qualifiés (IA)', value: countStatutLeads('qualifie') + countStatutLeads('en_attente') + countStatutLeads('escalade'), fill: '#319795' },
    { name: '3. Devis Générés', value: totalDevis, fill: '#E8872A' },
    { name: '4. Devis Acceptés', value: devisAcceptes.length, fill: '#00B4A0' }
  ]

  // Extraction et moyenne des coefficients (Indicateur clé d'audit de l'IA)
  const validDevis = devisRes.data || []
  const avgCoeff = (key: 'coeff_saisonnalite' | 'coeff_capacite' | 'coeff_delai') => {
    if (validDevis.length === 0) return 1
    return Number((validDevis.reduce((acc, curr) => acc + Number(curr[key] || 1), 0) / validDevis.length).toFixed(2))
  }

  const radarCoeffs = [
    { name: 'Saisonnalité', value: avgCoeff('coeff_saisonnalite') },
    { name: 'Volume Capacité', value: avgCoeff('coeff_capacite') },
    { name: 'Urgence Délai', value: avgCoeff('coeff_delai') }
  ]

  return {
    leadsCountToday: leadsTodayRes.count || 0,
    conversionRate,
    totalCaAccept,
    avgCompletude,
    hitlRate,
    funnelData,
    radarCoeffs,
    pendingRelances: relancesUrgentRes.data || []
  }
}
