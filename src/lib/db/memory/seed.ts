import type { Matrice } from '@/lib/types'

type SeedMatrice = Omit<Matrice, 'id'>

// ─── Grille base (forfait ≤ 180km) ───────────────────────────────────────────
// valeur_min/max = tranche km (inclusive), prix_base = tarif forfait
// Ligne >180km : prix = km × 2 × coefficient (2.5€/km)
const BASE: SeedMatrice[] = [
  { type: 'base', valeur_min: 0,   valeur_max: 10,    coefficient: 0,   prix_base: 250 },
  { type: 'base', valeur_min: 11,  valeur_max: 20,    coefficient: 0,   prix_base: 250 },
  { type: 'base', valeur_min: 21,  valeur_max: 30,    coefficient: 0,   prix_base: 250 },
  { type: 'base', valeur_min: 31,  valeur_max: 40,    coefficient: 0,   prix_base: 320 },
  { type: 'base', valeur_min: 41,  valeur_max: 50,    coefficient: 0,   prix_base: 350 },
  { type: 'base', valeur_min: 51,  valeur_max: 60,    coefficient: 0,   prix_base: 390 },
  { type: 'base', valeur_min: 61,  valeur_max: 70,    coefficient: 0,   prix_base: 430 },
  { type: 'base', valeur_min: 71,  valeur_max: 80,    coefficient: 0,   prix_base: 500 },
  { type: 'base', valeur_min: 81,  valeur_max: 90,    coefficient: 0,   prix_base: 540 },
  { type: 'base', valeur_min: 91,  valeur_max: 100,   coefficient: 0,   prix_base: 580 },
  { type: 'base', valeur_min: 101, valeur_max: 110,   coefficient: 0,   prix_base: 620 },
  { type: 'base', valeur_min: 111, valeur_max: 120,   coefficient: 0,   prix_base: 660 },
  { type: 'base', valeur_min: 121, valeur_max: 130,   coefficient: 0,   prix_base: 700 },
  { type: 'base', valeur_min: 131, valeur_max: 140,   coefficient: 0,   prix_base: 740 },
  { type: 'base', valeur_min: 141, valeur_max: 150,   coefficient: 0,   prix_base: 780 },
  { type: 'base', valeur_min: 151, valeur_max: 160,   coefficient: 0,   prix_base: 820 },
  { type: 'base', valeur_min: 161, valeur_max: 170,   coefficient: 0,   prix_base: 860 },
  { type: 'base', valeur_min: 171, valeur_max: 180,   coefficient: 0,   prix_base: 900 },
  // >180km : prix_simple = km × coefficient (2.5€/km), aller_retour × 2
  { type: 'base', valeur_min: 181, valeur_max: 99999, coefficient: 2.5, prix_base: 0   },
]

// ─── Saisonnalité ─────────────────────────────────────────────────────────────
// valeur_min/max = numéro de mois (1–12)
const SAISONNALITE: SeedMatrice[] = [
  // Basse -7% : janvier(1), février(2), août(8), novembre(11)
  { type: 'saisonnalite', valeur_min: 1,  valeur_max: 1,  coefficient: -0.07, prix_base: 0 },
  { type: 'saisonnalite', valeur_min: 2,  valeur_max: 2,  coefficient: -0.07, prix_base: 0 },
  { type: 'saisonnalite', valeur_min: 8,  valeur_max: 8,  coefficient: -0.07, prix_base: 0 },
  { type: 'saisonnalite', valeur_min: 11, valeur_max: 11, coefficient: -0.07, prix_base: 0 },
  // Moyenne 0% : septembre(9), octobre(10), décembre(12)
  { type: 'saisonnalite', valeur_min: 9,  valeur_max: 9,  coefficient: 0,     prix_base: 0 },
  { type: 'saisonnalite', valeur_min: 10, valeur_max: 10, coefficient: 0,     prix_base: 0 },
  { type: 'saisonnalite', valeur_min: 12, valeur_max: 12, coefficient: 0,     prix_base: 0 },
  // Haute +10% : mars(3), avril(4), juillet(7)
  { type: 'saisonnalite', valeur_min: 3,  valeur_max: 3,  coefficient: 0.10,  prix_base: 0 },
  { type: 'saisonnalite', valeur_min: 4,  valeur_max: 4,  coefficient: 0.10,  prix_base: 0 },
  { type: 'saisonnalite', valeur_min: 7,  valeur_max: 7,  coefficient: 0.10,  prix_base: 0 },
  // Très haute +15% : mai(5), juin(6)
  { type: 'saisonnalite', valeur_min: 5,  valeur_max: 5,  coefficient: 0.15,  prix_base: 0 },
  { type: 'saisonnalite', valeur_min: 6,  valeur_max: 6,  coefficient: 0.15,  prix_base: 0 },
]

// ─── Capacité ─────────────────────────────────────────────────────────────────
// valeur_min/max = nb passagers (>85 → HITL, géré dans la validation)
const CAPACITE: SeedMatrice[] = [
  { type: 'capacite', valeur_min: 1,  valeur_max: 19, coefficient: -0.05, prix_base: 0 },
  { type: 'capacite', valeur_min: 20, valeur_max: 53, coefficient: 0,     prix_base: 0 },
  { type: 'capacite', valeur_min: 54, valeur_max: 63, coefficient: 0.15,  prix_base: 0 },
  { type: 'capacite', valeur_min: 64, valeur_max: 67, coefficient: 0.20,  prix_base: 0 },
  { type: 'capacite', valeur_min: 68, valeur_max: 85, coefficient: 0.40,  prix_base: 0 },
]

// ─── Délai demande → départ ───────────────────────────────────────────────────
// valeur_min/max = jours avant départ
// DD_PRIORITAIRE : 0–1j | DD_URGENT : 2–7j | DD_NORMAL : 8–90j | DD_3MOISETPLUS : 91j+
const DELAI: SeedMatrice[] = [
  { type: 'delai', valeur_min: 0,  valeur_max: 1,     coefficient: 0.10,  prix_base: 0 },
  { type: 'delai', valeur_min: 2,  valeur_max: 7,     coefficient: 0.05,  prix_base: 0 },
  { type: 'delai', valeur_min: 8,  valeur_max: 90,    coefficient: -0.05, prix_base: 0 },
  { type: 'delai', valeur_min: 91, valeur_max: 99999, coefficient: -0.10, prix_base: 0 },
]

// ─── Suppléments ──────────────────────────────────────────────────────────────
// valeur_min = identifiant : 1=guide (€/jour), 2=nuit_chauffeur (€/nuit)
const SUPPLEMENTS: SeedMatrice[] = [
  { type: 'supplement', valeur_min: 1, valeur_max: 1, coefficient: 0, prix_base: 80  },
  { type: 'supplement', valeur_min: 2, valeur_max: 2, coefficient: 0, prix_base: 120 },
]

export const SEED_MATRICES: SeedMatrice[] = [
  ...BASE,
  ...SAISONNALITE,
  ...CAPACITE,
  ...DELAI,
  ...SUPPLEMENTS,
]
