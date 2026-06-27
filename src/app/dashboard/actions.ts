'use server'

import { getSupabaseClient } from '@/lib/supabase/client'

export interface DossierUrgent {
  demande_id: number
  urgence_code: 'DD_PRIORITAIRE' | 'DD_URGENT'
  ville_depart: string
  ville_arrivee: string
  date_depart: string
  nb_passagers: number
  type_statut: string
  created_at: string
  lead: { prenom: string; nom: string; email: string; telephone: string }
}

export interface DossierComplet {
  lead: {
    id: number
    prenom: string
    nom: string
    email: string
    telephone: string
    type_client: string
    societe?: string
    created_at: string
  }
  demande: {
    id: number
    ville_depart: string
    ville_arrivee: string
    date_depart: string
    date_arrivee: string
    aller_retour: boolean
    nb_passagers: number
    urgence_code: string
    type_statut: string
    score_completude: number
    commentaire?: string
  }
  devis: {
    id: number
    montant_ht: number
    montant_tva: number
    montant_ttc: number
    statut: string
    pdf_url?: string
    nb_relance: number
    prochaine_relance?: string
    date_envoi?: string
  } | null
}

export async function getDossiersUrgents(): Promise<DossierUrgent[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('demandes')
    .select('id, urgence_code, ville_depart, ville_arrivee, date_depart, nb_passagers, type_statut, created_at, leads(prenom, nom, email, telephone)')
    .in('urgence_code', ['DD_PRIORITAIRE', 'DD_URGENT'])
    .order('urgence_code', { ascending: true })
    .order('date_depart', { ascending: true })

  if (error || !data) return []

  return data.map((row: Record<string, unknown>) => {
    const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads
    return {
      demande_id:   row.id as number,
      urgence_code: row.urgence_code as 'DD_PRIORITAIRE' | 'DD_URGENT',
      ville_depart: row.ville_depart as string,
      ville_arrivee:row.ville_arrivee as string,
      date_depart:  row.date_depart as string,
      nb_passagers: row.nb_passagers as number,
      type_statut:  row.type_statut as string,
      created_at:   row.created_at as string,
      lead: lead as DossierUrgent['lead'],
    }
  })
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
