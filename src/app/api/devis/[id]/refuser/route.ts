import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getSupabaseClient()
  await supabase.from('devis').update({ statut: 'refuse' }).eq('id', Number(id))
  const origin = new URL(req.url).origin
  return NextResponse.redirect(new URL(`/confirmation?devis=${id}&statut=refuse`, origin))
}
