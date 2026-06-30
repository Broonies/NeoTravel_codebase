'use server'

import { getSupabaseClient } from '@/lib/supabase/client'

export interface DossierUrgent {
  demande_id:   number
  urgence_code: 'DD_PRIORITAIRE' | 'DD_URGENT'
  ville_depart:  string
  ville_arrivee: string
  date_depart:   string
  nb_passagers:  number
  type_statut:   string
  score_completude: number | null
  created_at:    string
  lead: { prenom: string; nom: string; email: string; telephone: string }
}

export interface DossierComplet {
  lead: {
    id: number; prenom: string; nom: string; email: string; telephone: string
    type_client: string; societe?: string; created_at: string
  }
  demande: {
    id: number; ville_depart: string; ville_arrivee: string; date_depart: string
    date_arrivee: string; aller_retour: boolean; nb_passagers: number
    urgence_code: string; type_statut: string; score_completude: number; commentaire?: string
  }
  devis: {
    id: number; montant_ht: number; montant_tva: number; montant_ttc: number
    statut: string; pdf_url?: string; nb_relance: number
    prochaine_relance?: string; date_envoi?: string
  } | null
}

export interface EscaladeHumaine {
  demande_id:       number
  ville_depart:     string
  ville_arrivee:    string
  date_depart:      string
  nb_passagers:     number
  commentaire:      string | null
  score_completude: number | null
  created_at:       string
  lead: { prenom: string; nom: string; email: string; telephone: string }
}

export interface RelanceActive {
  devis_id:      number
  demande_id:    number
  ville_depart:  string
  ville_arrivee: string
  date_depart:   string
  nb_relance:    number
  montant_ttc:   number
  prochaine_relance: string | null
  lead: { prenom: string; nom: string; email: string; societe?: string }
}

export async function getDossiersUrgents(): Promise<DossierUrgent[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('demandes')
    .select('id, urgence_code, ville_depart, ville_arrivee, date_depart, nb_passagers, type_statut, score_completude, created_at, leads(prenom, nom, email, telephone)')
    .in('urgence_code', ['DD_PRIORITAIRE', 'DD_URGENT'])
    .order('urgence_code', { ascending: true })
    .order('date_depart',  { ascending: true })

  if (error || !data) return []

  return data.map((row: Record<string, unknown>) => {
    const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads
    return {
      demande_id:       row.id as number,
      urgence_code:     row.urgence_code as 'DD_PRIORITAIRE' | 'DD_URGENT',
      ville_depart:     row.ville_depart as string,
      ville_arrivee:    row.ville_arrivee as string,
      date_depart:      row.date_depart as string,
      nb_passagers:     row.nb_passagers as number,
      type_statut:      row.type_statut as string,
      score_completude: row.score_completude as number | null,
      created_at:       row.created_at as string,
      lead: lead as DossierUrgent['lead'],
    }
  })
}

export async function getEscaladesHumaines(): Promise<EscaladeHumaine[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('demandes')
    .select('id, ville_depart, ville_arrivee, date_depart, nb_passagers, commentaire, score_completude, created_at, leads(prenom, nom, email, telephone)')
    .eq('type_statut', 'cas_complexe')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row: Record<string, unknown>) => {
    const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads
    return {
      demande_id:       row.id as number,
      ville_depart:     row.ville_depart as string,
      ville_arrivee:    row.ville_arrivee as string,
      date_depart:      row.date_depart as string,
      nb_passagers:     row.nb_passagers as number,
      commentaire:      row.commentaire as string | null,
      score_completude: row.score_completude as number | null,
      created_at:       row.created_at as string,
      lead: lead as EscaladeHumaine['lead'],
    }
  })
}

export async function getRelancesActives(): Promise<RelanceActive[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('devis')
    .select('id, nb_relance, montant_ttc, prochaine_relance, demandes(id, ville_depart, ville_arrivee, date_depart, leads(prenom, nom, email, societe))')
    .gt('nb_relance', 0)
    .order('nb_relance', { ascending: false })
    .limit(15)

  if (error || !data) return []

  return data.map((row: Record<string, unknown>) => {
    const demande = Array.isArray(row.demandes) ? (row.demandes as Record<string, unknown>[])[0] : row.demandes as Record<string, unknown>
    const lead    = demande?.leads
      ? (Array.isArray(demande.leads) ? (demande.leads as Record<string, unknown>[])[0] : demande.leads as Record<string, unknown>)
      : null
    return {
      devis_id:          row.id as number,
      demande_id:        (demande?.id as number) || 0,
      ville_depart:      (demande?.ville_depart  as string) || '?',
      ville_arrivee:     (demande?.ville_arrivee as string) || '?',
      date_depart:       (demande?.date_depart   as string) || '',
      nb_relance:        (row.nb_relance  as number) || 0,
      montant_ttc:       Number(row.montant_ttc || 0),
      prochaine_relance: row.prochaine_relance as string | null,
      lead: (lead || { prenom: 'Client', nom: 'Inconnu', email: '' }) as RelanceActive['lead'],
    }
  })
}

export async function updateDevisStatut(devisId: number, statut: 'accepte' | 'refuse') {
  const supabase = getSupabaseClient()
  await supabase.from('devis').update({ statut }).eq('id', devisId)
}

export async function getDossierComplet(demandeId: number): Promise<DossierComplet | null> {
  const supabase = getSupabaseClient()
  const { data: dem, error } = await supabase
    .from('demandes')
    .select('*, leads(*), devis(*)')
    .eq('id', demandeId)
    .single()

  if (error || !dem) return null

  const lead = Array.isArray(dem.leads) ? dem.leads[0] : dem.leads
  const devis = Array.isArray(dem.devis) ? dem.devis[0] : dem.devis

  return {
    lead,
    demande: {
      id:              dem.id,
      ville_depart:    dem.ville_depart,
      ville_arrivee:   dem.ville_arrivee,
      date_depart:     dem.date_depart,
      date_arrivee:    dem.date_arrivee,
      aller_retour:    dem.aller_retour,
      nb_passagers:    dem.nb_passagers,
      urgence_code:    dem.urgence_code,
      type_statut:     dem.type_statut,
      score_completude:dem.score_completude,
      commentaire:     dem.commentaire,
    },
    devis: devis ? {
      id:                devis.id,
      montant_ht:        devis.montant_ht,
      montant_tva:       devis.montant_tva,
      montant_ttc:       devis.montant_ttc,
      statut:            devis.statut,
      pdf_url:           devis.pdf_url,
      nb_relance:        devis.nb_relance,
      prochaine_relance: devis.prochaine_relance,
      date_envoi:        devis.date_envoi,
    } : null,
  }
}
