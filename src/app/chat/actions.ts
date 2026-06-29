'use server'
import { getSupabaseClient } from '@/lib/supabase/client'

export async function updateDevisStatutByDemande(demandeId: number, statut: 'accepte' | 'refuse') {
  const supabase = getSupabaseClient()
  await supabase.from('devis').update({ statut }).eq('demande_id', demandeId)
}
