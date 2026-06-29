'use server'

import { differenceInCalendarDays } from 'date-fns'
import { getSupabaseRepos } from '@/lib/db/supabase'
import { getRouteInfo } from '@/lib/pricing/here'
import { calculerDevis } from '@/lib/pricing/calculer-devis'
import { calculeUrgenceCode } from '@/lib/pricing/helpers'
import type { DevisData } from '@/lib/types'
import { persisterDevis } from '@/lib/services/persister-devis'

export interface DevisFormInput {
  ville_depart: string
  ville_arrivee: string
  date_depart: string
  date_arrivee: string
  nb_passagers: number
  aller_retour: boolean
  guide: boolean
  commentaire?: string
}

export interface SupplementDetail {
  peages: number
  nuit_chauffeur: number   // nb_nuits × 120€
  guide: number            // nb_jours × 80€
  nb_nuits: number
  nb_jours: number
}

export type DevisActionResult =
  | { ok: true; devis: DevisData; km: number; peages: number; supplement_detail: SupplementDetail; pdf_url: string | null }
  | { ok: false; error: string }

export async function calculerDevisAction(input: DevisFormInput): Promise<DevisActionResult> {
  console.log('\n' + '─'.repeat(52))
  console.log('📋 Nouvelle demande reçue')
  console.log(`   Trajet  : ${input.ville_depart} → ${input.ville_arrivee}`)
  console.log(`   Dates   : ${input.date_depart} → ${input.date_arrivee}`)
  console.log(`   Pax     : ${input.nb_passagers} | A/R: ${input.aller_retour} | Guide: ${input.guide}`)

  // ── Étape 1 : route HERE (distance + péages) ───────────────────────────────
  console.log('\n🗺️  [1/4] HERE Routing API...')
  const route = await getRouteInfo(input.ville_depart, input.ville_arrivee)
  if (!route.ok) {
    console.error(`   ❌ ${route.error}`)
    return { ok: false, error: route.error }
  }
  const peagesTotal = input.aller_retour
    ? Math.round(route.data.peages * 2 * 100) / 100
    : route.data.peages
  console.log(`   ✅ ${route.data.km} km | péages ${route.data.peages} € × ${input.aller_retour ? '2 (A/R)' : '1'} = ${peagesTotal} €`)

// ── Étape 2 : calcul urgence_code ─────────────────────────────────────────
  const urgenceCode = calculeUrgenceCode(new Date(), new Date(input.date_depart))
  console.log(`\n⏱️  [2/4] Urgence : ${urgenceCode}`)

  // ── Étape 3 : création de la demande (Supabase) ───────────────────────────
  console.log('\n🗄️  [3/4] Création de la demande en base...')
  const repos = getSupabaseRepos()

  let lead: Awaited<ReturnType<typeof repos.leads.create>>
  let demande: Awaited<ReturnType<typeof repos.demandes.create>>
  try {
    lead = await repos.leads.create({
      prenom: 'Test', nom: 'Formulaire', email: process.env.DEV_LEAD_EMAIL ?? 'test@neotravel.fr',
      telephone: '0600000000', type_client: 'particulier',
    })
    demande = await repos.demandes.create({
      lead_id: lead.id,
      ville_depart: input.ville_depart,
      ville_arrivee: input.ville_arrivee,
      date_depart: new Date(input.date_depart),
      date_arrivee: new Date(input.date_arrivee),
      aller_retour: input.aller_retour,
      nb_passagers: input.nb_passagers,
      type_trajet: 'standard',
      urgence_code: urgenceCode,
      details_json: { km_distance: route.data.km, peages: peagesTotal, guide: input.guide },
      score_completude: 1.0,
      type_statut: 'demande_qualifiee',
      commentaire: input.commentaire || undefined,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('   ❌ Supabase insert error:', msg)
    return { ok: false, error: `Erreur base de données : ${msg}` }
  }
  console.log(`   ✅ Demande #${demande.id} créée (lead #${lead.id})`)

  // ── Étape 4 : moteur de calcul ────────────────────────────────────────────
  console.log('\n🧮 [4/4] Moteur de calcul déterministe...')
  const result = await calculerDevis(demande.id, repos)

  if (!result.ok) {
    console.error(`   ❌ [${result.error}] ${result.reason}`)
    return { ok: false, error: `${result.error} — ${result.reason}` }
  }

  // ── Détail des suppléments (pour affichage UI) ────────────────────────────
  const nb_nuits = Math.max(
    0,
    differenceInCalendarDays(new Date(input.date_arrivee), new Date(input.date_depart)),
  )
  const nb_jours = nb_nuits + 1
  const supplement_detail: SupplementDetail = {
    peages:          peagesTotal,
    nuit_chauffeur:  nb_nuits > 0 ? nb_nuits * 120 : 0,
    guide:           input.guide ? nb_jours * 80 : 0,
    nb_nuits,
    nb_jours,
  }

  const d = result.data
  console.log('\n   ✅ Devis calculé :')
  console.log(`   Prix base      : ${d.prix_base} €`)
  console.log(`   Saisonnalité   : ${(d.coeff_saisonnalite * 100).toFixed(0)} %`)
  console.log(`   Capacité       : ${(d.coeff_capacite * 100).toFixed(0)} %`)
  console.log(`   Délai          : ${(d.coeff_delai * 100).toFixed(0)} %`)
  console.log(`   Suppléments    : péages ${supplement_detail.peages}€ | nuits ${supplement_detail.nuit_chauffeur}€ | guide ${supplement_detail.guide}€`)
  console.log(`   ───────────────────────────`)
  console.log(`   Montant HT     : ${d.montant_ht} €`)
  console.log(`   TVA 10 %       : ${d.montant_tva} €`)
  console.log(`   Montant TTC    : ${d.montant_ttc} €`)

  // ── Étape 5 : persistance devis + PDF ────────────────────────────────────
  console.log('\n💾 [5/5] Persistance devis + PDF...')
  let pdfUrl: string | null = null
  try {
    pdfUrl = await persisterDevis({
      demandeId:    demande.id,
      calcul:       d,
      trajet:       { ville_depart: input.ville_depart, ville_arrivee: input.ville_arrivee, km: route.data.km },
      dates:        { depart: input.date_depart, arrivee: input.date_arrivee, nb_nuits },
      passagers:    input.nb_passagers,
      aller_retour: input.aller_retour,
      supplements:  { peages: peagesTotal, nuit_chauffeur: supplement_detail.nuit_chauffeur, guide: supplement_detail.guide },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('   ⚠️  Persistance non-bloquante :', msg)
  }

  console.log('─'.repeat(52) + '\n')
  return { ok: true, devis: d, km: route.data.km, peages: peagesTotal, supplement_detail, pdf_url: pdfUrl }
}
