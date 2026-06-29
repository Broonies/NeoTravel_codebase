import { describe, it, expect } from 'vitest'
import { SEED_MATRICES } from '@/lib/db/memory/seed'
import type { Matrice } from '@/lib/types'
import {
  getPrixBase,
  getCoeffSaisonnalite,
  getCoeffCapacite,
  getCoeffDelai,
  calculeUrgenceCode,
  calculeSupplements,
  appliquePrix,
} from '@/lib/pricing/helpers'

const M: Matrice[] = SEED_MATRICES.map((m, i) => ({ ...m, id: i + 1 }))

// ─── getPrixBase ──────────────────────────────────────────────────────────────

describe('getPrixBase', () => {
  it('grille ≤ 180km — palier exact 100km', () => {
    expect(getPrixBase(100, false, M)).toBe(580)
  })

  it('grille ≤ 180km — 44.6km arrondi à 45km → palier 50km', () => {
    expect(getPrixBase(44.6, false, M)).toBe(350)
  })

  it('grille ≤ 180km — 18.74km arrondi à 19km → palier 20km', () => {
    expect(getPrixBase(18.74, false, M)).toBe(250)
  })

  it('grille ≤ 180km — 18.45km arrondi à 18km → palier 20km', () => {
    expect(getPrixBase(18.45, false, M)).toBe(250)
  })

  it('grille ≤ 180km — 180km → 900€', () => {
    expect(getPrixBase(180, false, M)).toBe(900)
  })

  it('> 180km — aller simple : km × 2.5', () => {
    // 200km × 2.5 = 500€
    expect(getPrixBase(200, false, M)).toBe(500)
  })

  it('aller/retour ≤ 180km : prix_simple × 2', () => {
    // 100km → 580€ × 2 = 1160€
    expect(getPrixBase(100, true, M)).toBe(1160)
  })

  it('aller/retour > 180km : km × 2.5 × 2', () => {
    // 200km × 2.5 × 2 = 1000€
    expect(getPrixBase(200, true, M)).toBe(1000)
  })
})

// ─── getCoeffSaisonnalite ─────────────────────────────────────────────────────

describe('getCoeffSaisonnalite', () => {
  it('janvier → basse -7%', () => {
    expect(getCoeffSaisonnalite(new Date('2026-01-15'), M)).toBe(-0.07)
  })
  it('mai → très haute +15%', () => {
    expect(getCoeffSaisonnalite(new Date('2026-05-20'), M)).toBe(0.15)
  })
  it('juin → très haute +15%', () => {
    expect(getCoeffSaisonnalite(new Date('2026-06-10'), M)).toBe(0.15)
  })
  it('mars → haute +10%', () => {
    expect(getCoeffSaisonnalite(new Date('2026-03-15'), M)).toBe(0.10)
  })
  it('octobre → moyenne 0%', () => {
    expect(getCoeffSaisonnalite(new Date('2026-10-01'), M)).toBe(0)
  })
  it('août → basse -7%', () => {
    expect(getCoeffSaisonnalite(new Date('2026-08-10'), M)).toBe(-0.07)
  })
})

// ─── getCoeffCapacite ─────────────────────────────────────────────────────────

describe('getCoeffCapacite', () => {
  it('1 passager → -5%', () => {
    expect(getCoeffCapacite(1, M)).toBe(-0.05)
  })
  it('19 passagers → -5%', () => {
    expect(getCoeffCapacite(19, M)).toBe(-0.05)
  })
  it('20 passagers → 0%', () => {
    expect(getCoeffCapacite(20, M)).toBe(0)
  })
  it('53 passagers → 0%', () => {
    expect(getCoeffCapacite(53, M)).toBe(0)
  })
  it('54 passagers → +15%', () => {
    expect(getCoeffCapacite(54, M)).toBe(0.15)
  })
  it('63 passagers → +15%', () => {
    expect(getCoeffCapacite(63, M)).toBe(0.15)
  })
  it('64 passagers → +20%', () => {
    expect(getCoeffCapacite(64, M)).toBe(0.20)
  })
  it('67 passagers → +20%', () => {
    expect(getCoeffCapacite(67, M)).toBe(0.20)
  })
  it('68 passagers → +40%', () => {
    expect(getCoeffCapacite(68, M)).toBe(0.40)
  })
  it('85 passagers → +40%', () => {
    expect(getCoeffCapacite(85, M)).toBe(0.40)
  })
})

// ─── getCoeffDelai ────────────────────────────────────────────────────────────

describe('getCoeffDelai', () => {
  it('DD_PRIORITAIRE → +10%', () => {
    expect(getCoeffDelai('DD_PRIORITAIRE', M)).toBe(0.10)
  })
  it('DD_URGENT → +5%', () => {
    expect(getCoeffDelai('DD_URGENT', M)).toBe(0.05)
  })
  it('DD_NORMAL → -5%', () => {
    expect(getCoeffDelai('DD_NORMAL', M)).toBe(-0.05)
  })
  it('DD_3MOISETPLUS → -10%', () => {
    expect(getCoeffDelai('DD_3MOISETPLUS', M)).toBe(-0.10)
  })
})

// ─── calculeUrgenceCode ───────────────────────────────────────────────────────

describe('calculeUrgenceCode', () => {
  const today = new Date('2026-06-25')

  it('départ demain (1j) → DD_PRIORITAIRE', () => {
    expect(calculeUrgenceCode(today, new Date('2026-06-26'))).toBe('DD_PRIORITAIRE')
  })
  it('départ dans 3j → DD_PRIORITAIRE (< 8j)', () => {
    expect(calculeUrgenceCode(today, new Date('2026-06-28'))).toBe('DD_PRIORITAIRE')
  })
  it('départ dans 7j → DD_PRIORITAIRE (limite haute 0-7j)', () => {
    expect(calculeUrgenceCode(today, new Date('2026-07-02'))).toBe('DD_PRIORITAIRE')
  })
  it('départ dans 8j → DD_URGENT (début tranche 8-14j)', () => {
    expect(calculeUrgenceCode(today, new Date('2026-07-03'))).toBe('DD_URGENT')
  })
  it('départ dans 14j → DD_URGENT (fin tranche 8-14j)', () => {
    expect(calculeUrgenceCode(today, new Date('2026-07-09'))).toBe('DD_URGENT')
  })
  it('départ dans 30j → DD_NORMAL', () => {
    expect(calculeUrgenceCode(today, new Date('2026-07-25'))).toBe('DD_NORMAL')
  })
  it('départ dans 91j → DD_3MOISETPLUS', () => {
    expect(calculeUrgenceCode(today, new Date('2026-09-24'))).toBe('DD_3MOISETPLUS')
  })
})

// ─── calculeSupplements ───────────────────────────────────────────────────────

describe('calculeSupplements', () => {
  it('aller simple même jour — aucun supplément', () => {
    expect(calculeSupplements(
      new Date('2026-07-15'),
      new Date('2026-07-15'),
      {},
      M,
    )).toBe(0)
  })

  it('2 nuits → 2 × 120€ = 240€', () => {
    expect(calculeSupplements(
      new Date('2026-07-15'),
      new Date('2026-07-17'),
      {},
      M,
    )).toBe(240)
  })

  it('1 nuit + guide → 120 + (2j × 80) = 280€', () => {
    expect(calculeSupplements(
      new Date('2026-07-15'),
      new Date('2026-07-16'),
      { guide: true },
      M,
    )).toBe(280) // 120 nuit + 160 guide (2j)
  })

  it('péages seuls 50€', () => {
    expect(calculeSupplements(
      new Date('2026-07-15'),
      new Date('2026-07-15'),
      { peages: 50 },
      M,
    )).toBe(50)
  })
})

// ─── appliquePrix ─────────────────────────────────────────────────────────────

describe('appliquePrix', () => {
  it('formule complète sans supplément', () => {
    // prix_base=580, c_saison=+0.10, c_capa=0, c_delai=-0.05
    // prix_ajuste = 580 * 1.05 = 609
    // montant_ht = 609 * 1.15 = 700.35
    // montant_tva = 700.35 * 0.10 = 70.035 → 70.04
    // montant_ttc = 770.39
    const r = appliquePrix(580, 0.10, 0, -0.05, 0)
    expect(r.montant_ht).toBeCloseTo(700.35, 2)
    expect(r.montant_tva).toBeCloseTo(70.04, 2)
    expect(r.montant_ttc).toBeCloseTo(770.39, 2)
    expect(r.marge).toBe(0.15)
    expect(r.taux_tva).toBe(0.10)
  })

  it('avec supplément 240€', () => {
    // prix_base=580, coeff nets = 0
    // prix_ajuste = 580
    // montant_ht = (580 + 240) * 1.15 = 820 * 1.15 = 943
    const r = appliquePrix(580, 0, 0, 0, 240)
    expect(r.montant_ht).toBeCloseTo(943, 2)
    expect(r.montant_ttc).toBeCloseTo(1037.3, 1)
  })
})
