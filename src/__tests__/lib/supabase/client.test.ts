import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

describe('getSupabaseClient', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  beforeEach(() => {
    vi.resetModules()
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl

    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey
  })

  it('returns a safe fallback client when Supabase credentials are missing', async () => {
    const { getSupabaseClient } = await import('@/lib/supabase/client')

    const client = getSupabaseClient()
    const result = await client.from('demandes').select('*')

    expect(result.error).toBeNull()
    expect(result.data).toEqual([])
  })
})
