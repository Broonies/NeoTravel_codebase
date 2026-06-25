import type { DevisOutput } from '@/lib/types'
import type { AppRepos } from '@/lib/db/repositories'
import {
  getPrixBase,
  getCoeffSaisonnalite,
  getCoeffCapacite,
  getCoeffDelai,
  calculeSupplements,
  appliquePrix,
} from './helpers'

export async function calculerDevis(
  demandeId: number,
  repos: AppRepos,
): Promise<DevisOutput> {
  // 1. Lecture de la demande
  const demande = await repos.demandes.findById(demandeId)
  if (!demande) {
    return { ok: false, error: 'DEMANDE_NOT_FOUND', reason: `Demande ${demandeId} introuvable` }
  }

  // 2. Validations (guards)
  if (demande.score_completude < 1.0) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      reason: `Demande incomplète (score ${demande.score_completude}) — compléter avant de calculer`,
    }
  }

  const { nb_passagers, date_depart, date_arrivee, aller_retour, urgence_code, details_json } = demande

  if (nb_passagers === 0) {
    return { ok: false, error: 'INVALID_INPUT', reason: '0 passager : demande invalide' }
  }
  if (nb_passagers > 85) {
    return {
      ok: false,
      error: 'HITL_REQUIRED',
      reason: `${nb_passagers} passagers dépasse la capacité maximale (85) — escalade commerciale requise`,
    }
  }

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const depart = new Date(date_depart)
  depart.setHours(0, 0, 0, 0)

  if (depart < now) {
    return { ok: false, error: 'INVALID_INPUT', reason: 'La date de départ est dans le passé' }
  }
  if (new Date(date_arrivee) < new Date(date_depart)) {
    return { ok: false, error: 'INVALID_INPUT', reason: 'La date d\'arrivée est antérieure à la date de départ' }
  }

  const km_distance = details_json.km_distance
  if (!km_distance || km_distance <= 0) {
    return { ok: false, error: 'INVALID_INPUT', reason: 'Distance km manquante — appelez getRouteInfo() avant calculerDevis()' }
  }

  // 3. Chargement des matrices (une seule lecture)
  const matrices = await repos.matrices.findAll()

  // 4. Calcul de chaque composant
  const prix_base = getPrixBase(km_distance, aller_retour, matrices)
  const coeff_saisonnalite = getCoeffSaisonnalite(new Date(date_depart), matrices)
  const coeff_capacite = getCoeffCapacite(nb_passagers, matrices)
  const coeff_delai = getCoeffDelai(urgence_code, matrices)
  const supplement = calculeSupplements(new Date(date_depart), new Date(date_arrivee), details_json, matrices)

  // 5. Application de la formule
  const prix = appliquePrix(prix_base, coeff_saisonnalite, coeff_capacite, coeff_delai, supplement)

  return {
    ok: true,
    data: {
      km_distance,
      ...prix,
      mode_generation: 'DETERMINISTE',
    },
  }
}
