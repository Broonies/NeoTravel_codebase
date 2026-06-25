import type { Lead, Demande, Devis, Relance, Matrice, MatriceType } from '@/lib/types'
import type {
  ILeadRepo,
  IDemandRepo,
  IDevisRepo,
  IRelanceRepo,
  IMatriceRepo,
  AppRepos,
} from '@/lib/db/repositories'
import { SEED_MATRICES } from './seed'

class InMemoryLeadRepo implements ILeadRepo {
  private store = new Map<number, Lead>()
  private nextId = 1

  async create(data: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> {
    const lead: Lead = { ...data, id: this.nextId++, created_at: new Date() }
    this.store.set(lead.id, lead)
    return lead
  }

  async findById(id: number): Promise<Lead | null> {
    return this.store.get(id) ?? null
  }
}

class InMemoryDemandRepo implements IDemandRepo {
  private store = new Map<number, Demande>()
  private nextId = 1

  async create(data: Omit<Demande, 'id'>): Promise<Demande> {
    const demande: Demande = { ...data, id: this.nextId++ }
    this.store.set(demande.id, demande)
    return demande
  }

  async findById(id: number): Promise<Demande | null> {
    return this.store.get(id) ?? null
  }

  async update(id: number, patch: Partial<Omit<Demande, 'id'>>): Promise<Demande> {
    const existing = this.store.get(id)
    if (!existing) throw new Error(`Demande ${id} not found`)
    const updated = { ...existing, ...patch }
    this.store.set(id, updated)
    return updated
  }
}

class InMemoryDevisRepo implements IDevisRepo {
  private store = new Map<number, Devis>()
  private nextId = 1

  async create(data: Omit<Devis, 'id'>): Promise<Devis> {
    const devis: Devis = { ...data, id: this.nextId++ }
    this.store.set(devis.id, devis)
    return devis
  }

  async findById(id: number): Promise<Devis | null> {
    return this.store.get(id) ?? null
  }

  async findByDemandeId(demande_id: number): Promise<Devis | null> {
    for (const d of this.store.values()) {
      if (d.demande_id === demande_id) return d
    }
    return null
  }

  async update(id: number, patch: Partial<Omit<Devis, 'id'>>): Promise<Devis> {
    const existing = this.store.get(id)
    if (!existing) throw new Error(`Devis ${id} not found`)
    const updated = { ...existing, ...patch }
    this.store.set(id, updated)
    return updated
  }
}

class InMemoryRelanceRepo implements IRelanceRepo {
  private store = new Map<number, Relance>()
  private nextId = 1

  async create(data: Omit<Relance, 'id'>): Promise<Relance> {
    const relance: Relance = { ...data, id: this.nextId++ }
    this.store.set(relance.id, relance)
    return relance
  }

  async findByDevisId(devis_id: number): Promise<Relance[]> {
    return [...this.store.values()].filter(r => r.devis_id === devis_id)
  }
}

class InMemoryMatriceRepo implements IMatriceRepo {
  private store: Matrice[]

  constructor() {
    this.store = SEED_MATRICES.map((m, i) => ({ ...m, id: i + 1 }))
  }

  async findByType(type: MatriceType): Promise<Matrice[]> {
    return this.store.filter(m => m.type === type)
  }

  async findAll(): Promise<Matrice[]> {
    return [...this.store]
  }
}

export function createMemoryRepos(): AppRepos {
  return {
    leads: new InMemoryLeadRepo(),
    demandes: new InMemoryDemandRepo(),
    devis: new InMemoryDevisRepo(),
    relances: new InMemoryRelanceRepo(),
    matrices: new InMemoryMatriceRepo(),
  }
}

// Singleton persistant entre les appels Server Action (process Node.js unique)
let _repos: AppRepos | null = null
export function getMemoryRepos(): AppRepos {
  if (!_repos) _repos = createMemoryRepos()
  return _repos
}
