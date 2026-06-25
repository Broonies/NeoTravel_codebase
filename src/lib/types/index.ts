export type UrgenceCode =
  | 'DD_PRIORITAIRE'
  | 'DD_URGENT'
  | 'DD_NORMAL'
  | 'DD_3MOISETPLUS'

export type DemandeStatut =
  | 'nouvelle_demande'
  | 'demande_qualifiee'
  | 'demande_incomplete'
  | 'cas_complexe'

export type DevisStatut =
  | 'envoye'
  | 'accepte'
  | 'refuse'
  | 'relance_1'
  | 'relance_2'
  | 'cloture'

export type MatriceType =
  | 'base'
  | 'saisonnalite'
  | 'capacite'
  | 'delai'
  | 'supplement'

// ─── Tables ───────────────────────────────────────────────────────────────────

export interface Lead {
  id: number
  prenom: string
  nom: string
  email: string
  telephone: string
  societe?: string
  type_client: string
  created_at: Date
}

export interface DetailsJson {
  km_distance?: number
  nuit_chauffeur?: boolean
  guide?: boolean
  peages?: number        // montant fixe €
  heure_depart?: string  // "HH:mm" — futur
  heure_arrivee?: string // "HH:mm" — futur
}

export interface Demande {
  id: number
  lead_id: number
  ville_depart: string
  ville_arrivee: string
  date_depart: Date
  date_arrivee: Date
  aller_retour: boolean
  nb_passagers: number
  type_trajet: string
  urgence_code: UrgenceCode
  details_json: DetailsJson
  score_completude: number
  type_statut: DemandeStatut
  commentaire?: string
}

export interface Matrice {
  id: number
  type: MatriceType
  valeur_min: number
  valeur_max: number
  coefficient: number
  prix_base: number
}

export interface Devis {
  id: number
  demande_id: number
  coeff_saisonnalite: number
  coeff_capacite: number
  coeff_delai: number
  supplement: number
  marge: number
  montant_ht: number
  taux_tva: number
  montant_tva: number
  montant_ttc: number
  statut: DevisStatut
  date_envoi?: Date
  mode_generation: string
  pdf_url?: string
  nb_relance: number
  prochaine_relance?: Date
}

export interface Relance {
  id: number
  devis_id: number
  niveau_relance: number
  planifiee_at: Date
  envoye_at?: Date
  prochaine_at?: Date
  message_genere: string
}

// ─── calculer_devis() output ──────────────────────────────────────────────────

export interface DevisData {
  km_distance: number
  prix_base: number
  coeff_saisonnalite: number
  coeff_capacite: number
  coeff_delai: number
  supplement: number
  marge: number
  montant_ht: number
  taux_tva: number
  montant_tva: number
  montant_ttc: number
  mode_generation: 'DETERMINISTE'
}

export type DevisOutput =
  | { ok: true; data: DevisData }
  | { ok: false; error: 'HITL_REQUIRED' | 'INVALID_INPUT' | 'DEMANDE_NOT_FOUND'; reason: string }
