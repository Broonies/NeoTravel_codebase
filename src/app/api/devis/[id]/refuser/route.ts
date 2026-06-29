import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getSupabaseClient()
  await supabase.from('devis').update({ statut: 'refuse' }).eq('id', Number(id))
  return NextResponse.redirect(new URL(`/confirmation?devis=${id}&statut=refuse`, process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'))
}
