import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function createFallbackClient(): SupabaseClient {
  const emptyList  = { data: [] as unknown[], error: null, count: 0 }
  const emptyOne   = { data: null, error: null }
  const makeSelect = () => Object.assign(Promise.resolve(emptyList), {
    eq: () => ({
      single:      () => Promise.resolve(emptyOne),
      maybeSingle: () => Promise.resolve(emptyOne),
      select:      () => Promise.resolve(emptyList),
    }),
    in:  () => ({ order: () => ({ order: () => Promise.resolve(emptyList) }) }),
    order: () => ({ order: () => Promise.resolve(emptyList) }),
    single:      () => Promise.resolve(emptyOne),
    maybeSingle: () => Promise.resolve(emptyOne),
  })
  return {
    from: () => ({
      select: makeSelect,
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      eq: () => ({
        select: () => Promise.resolve({ data: [], error: null, count: 0 }),
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
      }),
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      order: () => ({
        order: () => ({
          select: () => Promise.resolve({ data: [], error: null, count: 0 }),
        }),
      }),
      in: () => ({
        order: () => ({
          order: () => Promise.resolve({ data: [], error: null, count: 0 }),
        }),
      }),
    }),
  } as unknown as SupabaseClient
}

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    _client = createFallbackClient()
    return _client
  }

  _client = createClient(url, key, { auth: { persistSession: false } })
  return _client
}
