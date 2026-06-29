// Snapshot de santé du MVP NeoTravel.
// Usage : npm run health

import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { auth: { persistSession: false }, realtime: { transport: ws as any } },
)

const HERE_API_KEY = process.env.HERE_API_KEY!

function ok(label: string, detail = '') {
  console.log(`  ✅ ${label}${detail ? ' — ' + detail : ''}`)
}
function fail(label: string, detail = '') {
  console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`)
}

// ── 1. Supabase DB ────────────────────────────────────────────────────────────

async function checkSupabase() {
  console.log('\n📦 Supabase DB')
  const { count, error } = await supabase.from('leads').select('*', { count: 'exact', head: true })
  if (error) { fail('Connexion', error.message); return }
  ok('Connexion', `${count} leads en base`)
}

// ── 2. Supabase Storage ───────────────────────────────────────────────────────

async function checkStorage() {
  console.log('\n🗂️  Supabase Storage')
  const { data, error } = await supabase.storage.getBucket('devis-pdfs')
  if (error) { fail('Bucket devis-pdfs', error.message); return }
  ok('Bucket devis-pdfs', data.public ? 'public' : 'privé')
}

// ── 3. HERE Routing API ───────────────────────────────────────────────────────

async function checkHere() {
  console.log('\n🗺️  HERE Routing API')
  try {
    const url = `https://geocode.search.hereapi.com/v1/geocode?q=Paris&apiKey=${HERE_API_KEY}&limit=1`
    const res = await fetch(url)
    if (!res.ok) { fail(`HTTP ${res.status}`); return }
    const json = await res.json() as { items?: unknown[] }
    ok('Géocodage', `${json.items?.length ?? 0} résultat(s) pour "Paris"`)
  } catch (e) {
    fail('Fetch échoué', String(e))
  }
}

// ── 4. Pipeline devis ─────────────────────────────────────────────────────────

async function checkPipeline() {
  console.log('\n📊 Pipeline devis')
  const statuts = ['envoye', 'relance_1', 'relance_2', 'accepte', 'refuse', 'cloture'] as const
  for (const statut of statuts) {
    const { count } = await supabase.from('devis').select('*', { count: 'exact', head: true }).eq('statut', statut)
    console.log(`  ${statut.padEnd(12)} : ${count ?? 0}`)
  }
}

// ── 5. File d'attente n8n ─────────────────────────────────────────────────────

async function checkN8nQueue() {
  console.log('\n⚡ File d\'attente n8n (prochaine_relance <= NOW())')
  const { data, error } = await supabase
    .from('devis')
    .select('id, statut, prochaine_relance, demandes(ville_depart, ville_arrivee)')
    .in('statut', ['envoye', 'relance_1', 'relance_2'])
    .lte('prochaine_relance', new Date().toISOString())

  if (error) { fail('Requête', error.message); return }

  if (!data || data.length === 0) {
    console.log('  Aucun devis en attente de relance')
    return
  }

  for (const d of data) {
    const dem = Array.isArray(d.demandes) ? d.demandes[0] : d.demandes as { ville_depart: string; ville_arrivee: string } | null
    const trajet = dem ? `${dem.ville_depart} → ${dem.ville_arrivee}` : '?'
    console.log(`  ⚠️  Devis #${d.id} [${d.statut}] — ${trajet} — relance due le ${new Date(d.prochaine_relance).toLocaleDateString('fr-FR')}`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('═'.repeat(52))
console.log('🏥 NeoTravel — Health Check')
console.log(`   ${new Date().toLocaleString('fr-FR')}`)
console.log(`   Supabase : ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
console.log('═'.repeat(52))

await checkSupabase()
await checkStorage()
await checkHere()
await checkPipeline()
await checkN8nQueue()

console.log('\n' + '═'.repeat(52) + '\n')
