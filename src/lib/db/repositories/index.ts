import type { Lead, Demande, Devis, Relance, Matrice, MatriceType } from '@/lib/types'

export interface ILeadRepo {
  create(data: Omit<Lead, 'id' | 'created_at'>): Promise<Lead>
  findById(id: number): Promise<Lead | null>
}

export interface IDemandRepo {
  create(data: Omit<Demande, 'id'>): Promise<Demande>
  findById(id: number): Promise<Demande | null>
  update(id: number, patch: Partial<Omit<Demande, 'id'>>): Promise<Demande>
}

export interface IDevisRepo {
  create(data: Omit<Devis, 'id'>): Promise<Devis>
  findById(id: number): Promise<Devis | null>
  findByDemandeId(demande_id: number): Promise<Devis | null>
  update(id: number, patch: Partial<Omit<Devis, 'id'>>): Promise<Devis>
}

export interface IRelanceRepo {
  create(data: Omit<Relance, 'id'>): Promise<Relance>
  findByDevisId(devis_id: number): Promise<Relance[]>
}

export interface IMatriceRepo {
  findByType(type: MatriceType): Promise<Matrice[]>
  findAll(): Promise<Matrice[]>
}

export interface AppRepos {
  leads: ILeadRepo
  demandes: IDemandRepo
  devis: IDevisRepo
  relances: IRelanceRepo
  matrices: IMatriceRepo
}
