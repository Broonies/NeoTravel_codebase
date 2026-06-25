import { differenceInCalendarDays } from 'date-fns'
import type { Matrice, UrgenceCode, DetailsJson } from '@/lib/types'

// Correspondance urgence_code → jours représentatifs pour lookup Matrices
const URGENCE_TO_JOURS: Record<UrgenceCode, number> = {
  DD_PRIORITAIRE: 0,
  DD_URGENT: 2,
  DD_NORMAL: 8,
  DD_3MOISETPLUS: 91,
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function lookupRange(
  matrices: Matrice[],
  type: Matrice['type'],
  value: number,
): Matrice | undefined {
  return matrices.find(
    m => m.type === type && value >= m.valeur_min && value <= m.valeur_max,
  )
}

// ─── Prix de base ─────────────────────────────────────────────────────────────

export function getPrixBase(
  km_distance: number,
  aller_retour: boolean,
  matrices: Matrice[],
): number {
  const km = Math.round(km_distance)
  const row = lookupRange(matrices, 'base', km)
  if (!row) throw new Error(`Aucune matrice base trouvée pour ${km} km`)

  const prix_simple =
    km <= 180
      ? row.prix_base
      : km * row.coefficient // >180km : km × 2.5€/km

  return aller_retour ? prix_simple * 2 : prix_simple
}

// ─── Coefficients ─────────────────────────────────────────────────────────────

export function getCoeffSaisonnalite(date_depart: Date, matrices: Matrice[]): number {
  const mois = date_depart.getMonth() + 1 // 1–12
  const row = lookupRange(matrices, 'saisonnalite', mois)
  return row?.coefficient ?? 0
}

export function getCoeffCapacite(nb_passagers: number, matrices: Matrice[]): number {
  const row = lookupRange(matrices, 'capacite', nb_passagers)
  return row?.coefficient ?? 0
}

export function getCoeffDelai(urgence_code: UrgenceCode, matrices: Matrice[]): number {
  const jours = URGENCE_TO_JOURS[urgence_code]
  const row = lookupRange(matrices, 'delai', jours)
  return row?.coefficient ?? 0
}

// ─── Suppléments ──────────────────────────────────────────────────────────────

export function calculeSupplements(
  date_depart: Date,
  date_arrivee: Date,
  details_json: DetailsJson,
  matrices: Matrice[],
): number {
  const nb_nuits = Math.max(0, differenceInCalendarDays(date_arrivee, date_depart))
  const nb_jours = nb_nuits + 1

  const prixGuide = matrices.find(m => m.type === 'supplement' && m.valeur_min === 1)?.prix_base ?? 80
  const prixNuit = matrices.find(m => m.type === 'supplement' && m.valeur_min === 2)?.prix_base ?? 120

  let total = 0

  // Nuit chauffeur déduite des dates (multi-jours = nuit automatique)
  if (nb_nuits > 0) {
    total += nb_nuits * prixNuit
  }

  // Guide : explicite dans la demande
  if (details_json.guide) {
    total += nb_jours * prixGuide
  }

  // Péages : montant fixe explicite
  if (details_json.peages && details_json.peages > 0) {
    total += details_json.peages
  }

  return total
}

// ─── Urgence code ─────────────────────────────────────────────────────────────

export function calculeUrgenceCode(date_demande: Date, date_depart: Date): UrgenceCode {
  const jours = differenceInCalendarDays(date_depart, date_demande)
  if (jours < 2) return 'DD_PRIORITAIRE'
  if (jours <= 7) return 'DD_URGENT'
  if (jours <= 90) return 'DD_NORMAL'
  return 'DD_3MOISETPLUS'
}

// ─── Formule finale ───────────────────────────────────────────────────────────

export interface PrixDetail {
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
}

export function appliquePrix(
  prix_base: number,
  coeff_saisonnalite: number,
  coeff_capacite: number,
  coeff_delai: number,
  supplement: number,
): PrixDetail {
  const MARGE = 0.15
  const TVA = 0.10

  const prix_ajuste = round2(prix_base * (1 + coeff_saisonnalite + coeff_capacite + coeff_delai))
  const montant_ht = round2((prix_ajuste + supplement) * (1 + MARGE))
  const montant_tva = round2(montant_ht * TVA)
  const montant_ttc = round2(montant_ht + montant_tva)

  return {
    prix_base,
    coeff_saisonnalite,
    coeff_capacite,
    coeff_delai,
    supplement,
    marge: MARGE,
    montant_ht,
    taux_tva: TVA,
    montant_tva,
    montant_ttc,
  }
}
