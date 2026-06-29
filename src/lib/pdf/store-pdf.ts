import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DevisDocument, type DevisPdfData } from './devis-document'

const BUCKET = 'devis-pdfs'

export async function generateAndStorePdf(
  devisId: number,
  data: DevisPdfData,
): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(React.createElement(DevisDocument, { data }) as any)

    const supabase = getSupabaseClient()
    const path = `devis-${devisId}.pdf`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, new Uint8Array(buffer), { contentType: 'application/pdf', upsert: true })

    if (error) {
      console.error('❌ Storage upload:', error.message)
      return null
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return publicUrl
  } catch (err) {
    console.error('❌ generateAndStorePdf:', err)
    return null
  }
}
