import { describe, it, expect, beforeEach } from 'vitest'
import { createMemoryRepos } from '@/lib/db/memory'
import { calculerDevis } from '@/lib/pricing/calculer-devis'
import type { UrgenceCode, DemandeStatut } from '@/lib/types'
import type { AppRepos } from '@/lib/db/repositories'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULTS = {
  nb_passagers: 30,
  date_depart: '2026-09-15',    // septembre = saisonnalité 0%
  date_arrivee: '2026-09-15',
  aller_retour: false,
  urgence_code: 'DD_NORMAL' as UrgenceCode,  // -5%
  km_distance: 100,             // → prix_base 580€
  guide: false,
  peages: 0,
  score_completude: 1.0,
  type_statut: 'demande_qualifiee' as DemandeStatut,
}

async function creerLead(repos: AppRepos): Promise<number> {
  const lead = await repos.leads.create({
    prenom: 'Jean', nom: 'Test', email: 'jean.test@example.com',
    telephone: '0600000000', type_client: 'particulier',
  })
  return lead.id
}

async function creerDemande(
  repos: AppRepos,
  leadId: number,
  overrides: Partial<typeof DEFAULTS> = {},
): Promise<number> {
  const o = { ...DEFAULTS, ...overrides }
  const demande = await repos.demandes.create({
    lead_id: leadId,
    ville_depart: 'Paris',
    ville_arrivee: 'Lyon',
    date_depart: new Date(o.date_depart),
    date_arrivee: new Date(o.date_arrivee),
    aller_retour: o.aller_retour,
    nb_passagers: o.nb_passagers,
    type_trajet: 'standard',
    urgence_code: o.urgence_code,
    details_json: { km_distance: o.km_distance, guide: o.guide, peages: o.peages },
    score_completude: o.score_completude,
    type_statut: o.type_statut,
  })
  return demande.id
}

// Crée lead + demande en une étape pour les cas qui ne testent pas la relation Lead→Demande
async function scenario(repos: AppRepos, overrides: Partial<typeof DEFAULTS> = {}): Promise<number> {
  const leadId = await creerLead(repos)
  return creerDemande(repos, leadId, overrides)
}

// ─── Happy path ───────────────────────────────────────────────────────────────

describe('calculerDevis — happy path', () => {
  let repos: AppRepos

  beforeEach(() => { repos = createMemoryRepos() })

  it('1. Cas nominal (100km | sept 0% | 30pax 0% | DD_NORMAL -5%)', async () => {
    // HT = 580 × 0.95 × 1.15 = 633.65 | TTC = 697.02
    const id = await scenario(repos)
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error()
    expect(r.data.mode_generation).toBe('DETERMINISTE')
    expect(r.data.prix_base).toBe(580)
    expect(r.data.coeff_saisonnalite).toBe(0)
    expect(r.data.coeff_capacite).toBe(0)
    expect(r.data.coeff_delai).toBe(-0.05)
    expect(r.data.montant_ht).toBeCloseTo(633.65, 2)
    expect(r.data.montant_ttc).toBeCloseTo(697.02, 2)
  })

  it('2. Urgence prioritaire (50km | nov -7% | 25pax 0% | DD_PRIORITAIRE +10%)', async () => {
    // HT = 350 × 1.03 × 1.15 = 414.58
    const id = await scenario(repos, {
      date_depart: '2026-11-10', date_arrivee: '2026-11-10',
      km_distance: 50, nb_passagers: 25, urgence_code: 'DD_PRIORITAIRE',
    })
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error()
    expect(r.data.prix_base).toBe(350)
    expect(r.data.coeff_saisonnalite).toBe(-0.07)
    expect(r.data.coeff_delai).toBe(0.10)
    expect(r.data.montant_ht).toBeCloseTo(414.58, 2)
  })

  it('3. Multi-jours (150km | avr +10% | 40pax 0% | DD_NORMAL -5% | 2 nuits 240€)', async () => {
    // HT = (780 × 1.05 + 240) × 1.15 = 1059 × 1.15 = 1217.85
    const id = await scenario(repos, {
      date_depart: '2027-04-10', date_arrivee: '2027-04-12',
      km_distance: 150, nb_passagers: 40, urgence_code: 'DD_NORMAL',
    })
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error()
    expect(r.data.supplement).toBe(240)
    expect(r.data.montant_ht).toBeCloseTo(1217.85, 2)
  })

  it('4. Très haute saison + urgence (80km | juin +15% | 35pax 0% | DD_PRIORITAIRE +10%)', async () => {
    // HT = 500 × 1.25 × 1.15 = 718.75
    const id = await scenario(repos, {
      date_depart: '2027-06-20', date_arrivee: '2027-06-20',
      km_distance: 80, nb_passagers: 35, urgence_code: 'DD_PRIORITAIRE',
    })
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error()
    expect(r.data.coeff_saisonnalite).toBe(0.15)
    expect(r.data.coeff_delai).toBe(0.10)
    expect(r.data.prix_base).toBe(500)
    expect(r.data.montant_ht).toBeCloseTo(718.75, 2)
  })

  it('5. Aller/retour >180km (200km AR | oct 0% | 45pax 0% | DD_NORMAL -5%)', async () => {
    // prix_simple = 200×2.5 = 500 | ×2 AR = 1000 | HT = 1000×0.95×1.15 = 1092.5 | TTC = 1201.75
    const id = await scenario(repos, {
      date_depart: '2026-10-05', date_arrivee: '2026-10-05',
      km_distance: 200, nb_passagers: 45, aller_retour: true, urgence_code: 'DD_NORMAL',
    })
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error()
    expect(r.data.prix_base).toBe(1000)
    expect(r.data.montant_ht).toBeCloseTo(1092.5, 2)
    expect(r.data.montant_ttc).toBeCloseTo(1201.75, 2)
  })
})

// ─── Erreurs et HITL ──────────────────────────────────────────────────────────

describe('calculerDevis — erreurs et HITL', () => {
  let repos: AppRepos

  beforeEach(() => { repos = createMemoryRepos() })

  it('0 passager → INVALID_INPUT', async () => {
    const id = await scenario(repos, { nb_passagers: 0 })
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error()
    expect(r.error).toBe('INVALID_INPUT')
    expect(r.reason).toContain('0 passager')
  })

  it('date de départ dans le passé → INVALID_INPUT', async () => {
    const id = await scenario(repos, { date_depart: '2024-01-01', date_arrivee: '2024-01-01' })
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error()
    expect(r.error).toBe('INVALID_INPUT')
    expect(r.reason).toContain('passé')
  })

  it('date_arrivee < date_depart → INVALID_INPUT', async () => {
    const id = await scenario(repos, { date_depart: '2026-09-15', date_arrivee: '2026-09-10' })
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error()
    expect(r.error).toBe('INVALID_INPUT')
  })

  it('km_distance manquant → INVALID_INPUT', async () => {
    const id = await scenario(repos, { km_distance: 0 })
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error()
    expect(r.error).toBe('INVALID_INPUT')
  })

  it('demande_id inexistant → DEMANDE_NOT_FOUND', async () => {
    const r = await calculerDevis(9999, repos)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error()
    expect(r.error).toBe('DEMANDE_NOT_FOUND')
  })

  it('>85 passagers → HITL_REQUIRED', async () => {
    const id = await scenario(repos, { nb_passagers: 86 })
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error()
    expect(r.error).toBe('HITL_REQUIRED')
    expect(r.reason).toContain('escalade')
  })

  it('demande incomplète (score_completude < 1.0) → INVALID_INPUT', async () => {
    const id = await scenario(repos, { score_completude: 0.7, type_statut: 'demande_incomplete' })
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error()
    expect(r.error).toBe('INVALID_INPUT')
    expect(r.reason).toContain('incomplète')
  })
})

// ─── Combinaisons de coefficients ─────────────────────────────────────────────

describe('calculerDevis — combinaisons de coefficients', () => {
  let repos: AppRepos

  beforeEach(() => { repos = createMemoryRepos() })

  it('85 passagers → calcul OK (limite max avant HITL, coeff +40%)', async () => {
    const id = await scenario(repos, { nb_passagers: 85 })
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error()
    expect(r.data.coeff_capacite).toBe(0.40)
  })

  it('DD_3MOISETPLUS (120km | fév -7% | 30pax 0% | DD_3MOISETPLUS -10%)', async () => {
    // HT = 660 × 0.83 × 1.15 = 629.97
    const id = await scenario(repos, {
      date_depart: '2027-02-15', date_arrivee: '2027-02-15',
      km_distance: 120, urgence_code: 'DD_3MOISETPLUS',
    })
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error()
    expect(r.data.coeff_saisonnalite).toBe(-0.07)
    expect(r.data.coeff_delai).toBe(-0.10)
    expect(r.data.prix_base).toBe(660)
    expect(r.data.montant_ht).toBeCloseTo(629.97, 2)
  })

  it('Guide (1j) → supplement +80€', async () => {
    // HT = (580×0.95 + 80) × 1.15 = 631 × 1.15 = 725.65
    const id = await scenario(repos, { guide: true })
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error()
    expect(r.data.supplement).toBe(80)
    expect(r.data.montant_ht).toBeCloseTo(725.65, 2)
  })

  it('Péages 30€ → supplement 30€', async () => {
    // HT = (580×0.95 + 30) × 1.15 = 581 × 1.15 = 668.15
    const id = await scenario(repos, { peages: 30 })
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error()
    expect(r.data.supplement).toBe(30)
    expect(r.data.montant_ht).toBeCloseTo(668.15, 2)
  })

  it('Tranche capacité 54-63 pax (+15%) — 60 pax', async () => {
    // HT = 580 × 1.10 × 1.15 = 733.7
    const id = await scenario(repos, { nb_passagers: 60 })
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error()
    expect(r.data.coeff_capacite).toBe(0.15)
    expect(r.data.montant_ht).toBeCloseTo(733.7, 2)
  })

  it('Tranche capacité 64-67 pax (+20%) — 65 pax', async () => {
    // HT = 580 × 1.15 × 1.15 = 767.05
    const id = await scenario(repos, { nb_passagers: 65 })
    const r = await calculerDevis(id, repos)
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error()
    expect(r.data.coeff_capacite).toBe(0.20)
    expect(r.data.montant_ht).toBeCloseTo(767.05, 2)
  })

  it('Un lead, deux demandes : IDs distincts, calculs indépendants', async () => {
    const leadId = await creerLead(repos)
    const id1 = await creerDemande(repos, leadId, { km_distance: 50 })   // prix_base 350€
    const id2 = await creerDemande(repos, leadId, { km_distance: 100 })  // prix_base 580€
    const [r1, r2] = await Promise.all([calculerDevis(id1, repos), calculerDevis(id2, repos)])
    expect(r1.ok && r2.ok).toBe(true)
    if (!r1.ok || !r2.ok) throw new Error()
    expect(id1).not.toBe(id2)
    expect(r1.data.prix_base).toBe(350)
    expect(r2.data.prix_base).toBe(580)
  })
})
