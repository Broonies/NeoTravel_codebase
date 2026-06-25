import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { DevisDocument, type DevisPdfData } from '@/lib/pdf/devis-document'

export async function POST(req: Request) {
  const data: DevisPdfData = await req.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(DevisDocument, { data }) as any
  const buffer  = await renderToBuffer(element)

  const ville = `${data.trajet.ville_depart}-${data.trajet.ville_arrivee}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="devis-neotravel-${ville}.pdf"`,
    },
  })
}
