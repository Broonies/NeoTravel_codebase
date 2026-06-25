import type { Lead, Demande, Devis, Relance, Matrice, MatriceType } from '@/lib/types'
import type {
  ILeadRepo,
  IDemandRepo,
  IDevisRepo,
  IRelanceRepo,
  IMatriceRepo,
  AppRepos,
} from '@/lib/db/repositories'
import { supabase } from '@/lib/supabase/client'

// ── Helpers ────────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>

function toDate(v: unknown): Date {
  if (!v) return new Date(0)
  if (v instanceof Date) return v
  return new Date(v as string)
}

async function insertOne<T extends Row>(table: string, data: Row): Promise<T> {
  const { data: row, error } = await supabase.from(table).insert(data).select().single()
  if (error) throw error
  return row as T
}

async function selectOne<T extends Row>(table: string, field: string, value: unknown): Promise<T | null> {
  const { data, error } = await supabase.from(table).select().eq(field, value).single()
  if (error) return null
  return data as T
}

async function updateOne<T extends Row>(table: string, id: number, patch: Row): Promise<T> {
  const { data: row, error } = await supabase.from(table).update(patch).eq('id', id).select().single()
  if (error) throw error
  return row as T
}

function isoOrUndef(v: Date | undefined): string | undefined {
  return v instanceof Date ? v.toISOString() : v
}

// ── Leads ──────────────────────────────────────────────────────────────────────

class SupabaseLeadRepo implements ILeadRepo {
  async create(data: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> {
    const row = await insertOne<Row>('leads', data as Row)
    return { ...(row as unknown as Lead), created_at: toDate(row.created_at) }
  }

  async findById(id: number): Promise<Lead | null> {
    const row = await selectOne<Row>('leads', 'id', id)
    if (!row) return null
    return { ...(row as unknown as Lead), created_at: toDate(row.created_at) }
  }
}

// ── Demandes ───────────────────────────────────────────────────────────────────

class SupabaseDemandRepo implements IDemandRepo {
  async create(data: Omit<Demande, 'id'>): Promise<Demande> {
    const payload: Row = {
      ...data,
      date_depart:  data.date_depart instanceof Date  ? data.date_depart.toISOString()  : data.date_depart,
      date_arrivee: data.date_arrivee instanceof Date ? data.date_arrivee.toISOString() : data.date_arrivee,
    }
    const row = await insertOne<Row>('demandes', payload)
    return {
      ...(row as unknown as Demande),
      date_depart:  toDate(row.date_depart),
      date_arrivee: toDate(row.date_arrivee),
    }
  }

  async findById(id: number): Promise<Demande | null> {
    const row = await selectOne<Row>('demandes', 'id', id)
    if (!row) return null
    return {
      ...(row as unknown as Demande),
      date_depart:  toDate(row.date_depart),
      date_arrivee: toDate(row.date_arrivee),
    }
  }

  async update(id: number, patch: Partial<Omit<Demande, 'id'>>): Promise<Demande> {
    const payload: Row = { ...patch }
    if (patch.date_depart instanceof Date)  payload.date_depart  = patch.date_depart.toISOString()
    if (patch.date_arrivee instanceof Date) payload.date_arrivee = patch.date_arrivee.toISOString()
    const row = await updateOne<Row>('demandes', id, payload)
    return {
      ...(row as unknown as Demande),
      date_depart:  toDate(row.date_depart),
      date_arrivee: toDate(row.date_arrivee),
    }
  }
}

// ── Devis ──────────────────────────────────────────────────────────────────────

class SupabaseDevisRepo implements IDevisRepo {
  async create(data: Omit<Devis, 'id'>): Promise<Devis> {
    const payload: Row = {
      ...data,
      date_envoi:        isoOrUndef(data.date_envoi),
      prochaine_relance: isoOrUndef(data.prochaine_relance),
    }
    const row = await insertOne<Row>('devis', payload)
    return {
      ...(row as unknown as Devis),
      date_envoi:        row.date_envoi        ? toDate(row.date_envoi)        : undefined,
      prochaine_relance: row.prochaine_relance  ? toDate(row.prochaine_relance) : undefined,
    }
  }

  async findById(id: number): Promise<Devis | null> {
    const row = await selectOne<Row>('devis', 'id', id)
    if (!row) return null
    return {
      ...(row as unknown as Devis),
      date_envoi:        row.date_envoi        ? toDate(row.date_envoi)        : undefined,
      prochaine_relance: row.prochaine_relance  ? toDate(row.prochaine_relance) : undefined,
    }
  }

  async findByDemandeId(demande_id: number): Promise<Devis | null> {
    const { data, error } = await supabase.from('devis').select().eq('demande_id', demande_id).maybeSingle()
    if (error || !data) return null
    const row = data as Row
    return {
      ...(row as unknown as Devis),
      date_envoi:        row.date_envoi        ? toDate(row.date_envoi)        : undefined,
      prochaine_relance: row.prochaine_relance  ? toDate(row.prochaine_relance) : undefined,
    }
  }

  async update(id: number, patch: Partial<Omit<Devis, 'id'>>): Promise<Devis> {
    const payload: Row = {
      ...patch,
      date_envoi:        isoOrUndef(patch.date_envoi),
      prochaine_relance: isoOrUndef(patch.prochaine_relance),
    }
    const row = await updateOne<Row>('devis', id, payload)
    return {
      ...(row as unknown as Devis),
      date_envoi:        row.date_envoi        ? toDate(row.date_envoi)        : undefined,
      prochaine_relance: row.prochaine_relance  ? toDate(row.prochaine_relance) : undefined,
    }
  }
}

// ── Relances ───────────────────────────────────────────────────────────────────

class SupabaseRelanceRepo implements IRelanceRepo {
  async create(data: Omit<Relance, 'id'>): Promise<Relance> {
    const payload: Row = {
      ...data,
      planifiee_at:  data.planifiee_at instanceof Date  ? data.planifiee_at.toISOString()  : data.planifiee_at,
      envoye_at:     data.envoye_at instanceof Date     ? data.envoye_at.toISOString()     : data.envoye_at,
      prochaine_at:  data.prochaine_at instanceof Date  ? data.prochaine_at.toISOString()  : data.prochaine_at,
    }
    const row = await insertOne<Row>('relances', payload)
    return {
      ...(row as unknown as Relance),
      planifiee_at:  toDate(row.planifiee_at),
      envoye_at:     row.envoye_at    ? toDate(row.envoye_at)    : undefined,
      prochaine_at:  row.prochaine_at ? toDate(row.prochaine_at) : undefined,
    }
  }

  async findByDevisId(devis_id: number): Promise<Relance[]> {
    const { data, error } = await supabase.from('relances').select().eq('devis_id', devis_id)
    if (error || !data) return []
    return (data as Row[]).map(row => ({
      ...(row as unknown as Relance),
      planifiee_at:  toDate(row.planifiee_at),
      envoye_at:     row.envoye_at    ? toDate(row.envoye_at)    : undefined,
      prochaine_at:  row.prochaine_at ? toDate(row.prochaine_at) : undefined,
    }))
  }
}

// ── Matrices ───────────────────────────────────────────────────────────────────

class SupabaseMatriceRepo implements IMatriceRepo {
  async findByType(type: MatriceType): Promise<Matrice[]> {
    const { data, error } = await supabase.from('matrices').select().eq('type', type)
    if (error || !data) return []
    return data as Matrice[]
  }

  async findAll(): Promise<Matrice[]> {
    const { data, error } = await supabase.from('matrices').select()
    if (error || !data) return []
    return data as Matrice[]
  }
}

// ── Export ─────────────────────────────────────────────────────────────────────

export function getSupabaseRepos(): AppRepos {
  return {
    leads:    new SupabaseLeadRepo(),
    demandes: new SupabaseDemandRepo(),
    devis:    new SupabaseDevisRepo(),
    relances: new SupabaseRelanceRepo(),
    matrices: new SupabaseMatriceRepo(),
  }
}
