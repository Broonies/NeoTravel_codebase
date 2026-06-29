import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { DevisDocument, type DevisPdfData } from '@/lib/pdf/devis-document'
import { getSupabaseClient } from '@/lib/supabase/client'

export async function POST(req: Request) {
  const data: DevisPdfData = await req.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(DevisDocument, { data }) as any
  const buffer  = await renderToBuffer(element)

  const slug = `${data.trajet.ville_depart}-${data.trajet.ville_arrivee}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

  const filename = `${slug}-${Date.now()}.pdf`

  const supabase = getSupabaseClient()

  const { error } = await supabase.storage
    .from('devis')
    .upload(filename, new Uint8Array(buffer), {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('devis')
    .getPublicUrl(filename)

  return Response.json({ url: publicUrl })
}
