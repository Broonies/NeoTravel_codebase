import { getSupabaseRepos } from '@/lib/db/supabase'
import { generateAndStorePdf } from '@/lib/pdf/store-pdf'
import type { DevisPdfData } from '@/lib/pdf/devis-document'
import type { DevisData } from '@/lib/types'

export interface PersisterDevisParams {
  demandeId:    number
  calcul:       DevisData
  trajet:       { ville_depart: string; ville_arrivee: string; km: number }
  dates:        { depart: string; arrivee: string; nb_nuits: number }
  passagers:    number
  aller_retour: boolean
  supplements:  { peages: number; nuit_chauffeur: number; guide: number }
  client?:      { type_client: string; societe?: string; prenom?: string; nom?: string }
}

export async function persisterDevis(p: PersisterDevisParams): Promise<string | null> {
  const repos = getSupabaseRepos()

  const prochaine = new Date()
  prochaine.setDate(prochaine.getDate() + 7)

  const devis = await repos.devis.create({
    demande_id:         p.demandeId,
    coeff_saisonnalite: p.calcul.coeff_saisonnalite,
    coeff_capacite:     p.calcul.coeff_capacite,
    coeff_delai:        p.calcul.coeff_delai,
    supplement:         p.calcul.supplement,
    marge:              p.calcul.marge,
    montant_ht:         p.calcul.montant_ht,
    taux_tva:           p.calcul.taux_tva,
    montant_tva:        p.calcul.montant_tva,
    montant_ttc:        p.calcul.montant_ttc,
    statut:             'envoye',
    date_envoi:         new Date(),
    mode_generation:    p.calcul.mode_generation,
    nb_relance:         0,
    prochaine_relance:  prochaine,
  })

  const pdfData: DevisPdfData = {
    trajet:       p.trajet,
    passagers:    p.passagers,
    aller_retour: p.aller_retour,
    dates:        p.dates,
    prix: {
      base:        p.calcul.prix_base,
      montant_ht:  p.calcul.montant_ht,
      montant_tva: p.calcul.montant_tva,
      montant_ttc: p.calcul.montant_ttc,
    },
    coefficients: {
      saisonnalite: p.calcul.coeff_saisonnalite,
      capacite:     p.calcul.coeff_capacite,
      delai:        p.calcul.coeff_delai,
    },
    supplements:  p.supplements,
    mode:         p.calcul.mode_generation,
    client:       p.client,
  }

  const pdfUrl = await generateAndStorePdf(devis.id, pdfData)
  if (pdfUrl) {
    await repos.devis.update(devis.id, { pdf_url: pdfUrl })
    console.log(`   ✅ PDF stocké : ${pdfUrl}`)
  }

  return pdfUrl
}
