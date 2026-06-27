// Réinitialise leads/demandes/devis/relances et insère 5 scénarios de test n8n.
// Usage : npm run seed
// Les matrices ne sont pas touchées (données statiques).

import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { auth: { persistSession: false }, realtime: { transport: ws as any } }
)

// ── Helpers ───────────────────────────────────────────────────────────────────

function assertOk(error: unknown, label: string): void {
  if (error) { console.error(`✗ ${label}`, error); process.exit(1) }
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFrom(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

// ── Reset ─────────────────────────────────────────────────────────────────────

async function reset() {
  // Ordre FK obligatoire : relances → devis → demandes → leads
  for (const table of ['relances', 'devis', 'demandes', 'leads'] as const) {
    const { error } = await supabase.from(table).delete().gte('id', 1)
    assertOk(error, `reset ${table}`)
  }
  console.log('🗑  Tables réinitialisées (leads, demandes, devis, relances)\n')
}

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seed() {
  // ─────────────────────────────────────────────────────────────────────────────
  // SCÉNARIO 1 — statut: envoye
  // Déclencheur n8n : prochaine_relance atteinte → envoyer relance_1
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const { data: lead, error: e1 } = await supabase.from('leads').insert({
      prenom: 'Marie', nom: 'Dupont', email: 'xbev4@protonmail.com',
      telephone: '0601020304', societe: 'Entreprise Dupont SA',
      type_client: 'entreprise',
    }).select().single()
    assertOk(e1, 'lead 1')

    const { data: dem, error: e2 } = await supabase.from('demandes').insert({
      lead_id: lead!.id,
      ville_depart: 'Paris', ville_arrivee: 'Lyon',
      date_depart: daysFrom(30), date_arrivee: daysFrom(32),
      aller_retour: true, nb_passagers: 45, type_trajet: 'excursion',
      urgence_code: 'DD_NORMAL',
      details_json: { km_distance: 460, nuit_chauffeur: false, guide: false, peages: 0 },
      score_completude: 1.0, type_statut: 'demande_qualifiee',
    }).select().single()
    assertOk(e2, 'demande 1')

    const { error: e3 } = await supabase.from('devis').insert({
      demande_id: dem!.id,
      coeff_saisonnalite: 0.10, coeff_capacite: 0.00, coeff_delai: -0.05,
      supplement: 0, marge: 0.20,
      montant_ht: 2885, taux_tva: 0.20, montant_tva: 577, montant_ttc: 3462,
      statut: 'envoye',
      date_envoi: daysAgo(2),
      mode_generation: 'DETERMINISTE',
      nb_relance: 0,
      prochaine_relance: daysAgo(1),
    })
    assertOk(e3, 'devis 1')

    console.log('✓ Scénario 1 — statut: envoye')
    console.log('  Paris → Lyon | 45 pass. | aller-retour | 460 km | 3 462 € TTC')
    console.log('  → n8n doit déclencher relance_1 dans 5 jours\n')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCÉNARIO 2 — statut: relance_1
  // Déclencheur n8n : prochaine_relance atteinte → envoyer relance_2
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const { data: lead, error: e1 } = await supabase.from('leads').insert({
      prenom: 'Pierre', nom: 'Martin', email: 'xbev4@protonmail.com',
      telephone: '0612345678', societe: 'Asso Sportive des Bouches',
      type_client: 'association',
    }).select().single()
    assertOk(e1, 'lead 2')

    const { data: dem, error: e2 } = await supabase.from('demandes').insert({
      lead_id: lead!.id,
      ville_depart: 'Marseille', ville_arrivee: 'Nice',
      date_depart: daysFrom(60), date_arrivee: daysFrom(60),
      aller_retour: false, nb_passagers: 25, type_trajet: 'transfert',
      urgence_code: 'DD_NORMAL',
      details_json: { km_distance: 210, nuit_chauffeur: false, guide: false, peages: 0 },
      score_completude: 1.0, type_statut: 'demande_qualifiee',
    }).select().single()
    assertOk(e2, 'demande 2')

    const { data: dev, error: e3 } = await supabase.from('devis').insert({
      demande_id: dem!.id,
      coeff_saisonnalite: -0.07, coeff_capacite: 0.00, coeff_delai: -0.05,
      supplement: 0, marge: 0.20,
      montant_ht: 557, taux_tva: 0.20, montant_tva: 111, montant_ttc: 668,
      statut: 'relance_1',
      date_envoi: daysAgo(14),
      mode_generation: 'DETERMINISTE',
      nb_relance: 1,
      prochaine_relance: daysAgo(1),
    }).select().single()
    assertOk(e3, 'devis 2')

    const { error: e4 } = await supabase.from('relances').insert({
      devis_id: dev!.id,
      niveau_relance: 1,
      planifiee_at: daysAgo(7),
      envoye_at: daysAgo(7),
      prochaine_at: daysFrom(2),
      message_genere: "Bonjour Pierre, nous revenons vers vous concernant votre devis (trajet Marseille → Nice pour 25 personnes, 668 € TTC). N'hésitez pas à nous contacter pour toute question.",
    })
    assertOk(e4, 'relance 2-1')

    console.log('✓ Scénario 2 — statut: relance_1')
    console.log('  Marseille → Nice | 25 pass. | aller simple | 210 km | 668 € TTC')
    console.log('  → n8n doit déclencher relance_2 dans 2 jours\n')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCÉNARIO 3 — statut: relance_2
  // Déclencheur n8n : prochaine_relance atteinte → clôturer le dossier
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const { data: lead, error: e1 } = await supabase.from('leads').insert({
      prenom: 'Sophie', nom: 'Bernard', email: 'xbev4@protonmail.com',
      telephone: '0687654321', societe: 'Mairie de Valence',
      type_client: 'entreprise',
    }).select().single()
    assertOk(e1, 'lead 3')

    const { data: dem, error: e2 } = await supabase.from('demandes').insert({
      lead_id: lead!.id,
      ville_depart: 'Lyon', ville_arrivee: 'Bordeaux',
      date_depart: daysFrom(75), date_arrivee: daysFrom(77),
      aller_retour: true, nb_passagers: 55, type_trajet: 'sortie_scolaire',
      urgence_code: 'DD_NORMAL',
      details_json: { km_distance: 550, nuit_chauffeur: false, guide: true, peages: 0 },
      score_completude: 1.0, type_statut: 'demande_qualifiee',
    }).select().single()
    assertOk(e2, 'demande 3')

    const { data: dev, error: e3 } = await supabase.from('devis').insert({
      demande_id: dem!.id,
      coeff_saisonnalite: 0.00, coeff_capacite: 0.15, coeff_delai: -0.05,
      supplement: 240, marge: 0.20,
      montant_ht: 3894, taux_tva: 0.20, montant_tva: 779, montant_ttc: 4673,
      statut: 'relance_2',
      date_envoi: daysAgo(21),
      mode_generation: 'DETERMINISTE',
      nb_relance: 2,
      prochaine_relance: daysAgo(1),
    }).select().single()
    assertOk(e3, 'devis 3')

    const { error: e4 } = await supabase.from('relances').insert([
      {
        devis_id: dev!.id,
        niveau_relance: 1,
        planifiee_at: daysAgo(14),
        envoye_at: daysAgo(14),
        prochaine_at: daysAgo(7),
        message_genere: "Bonjour Sophie, nous souhaitions avoir votre retour sur le devis n°3 (excursion Lyon → Bordeaux pour 55 personnes, 4 673 € TTC). Avez-vous pu en prendre connaissance ?",
      },
      {
        devis_id: dev!.id,
        niveau_relance: 2,
        planifiee_at: daysAgo(7),
        envoye_at: daysAgo(7),
        prochaine_at: daysFrom(2),
        message_genere: "Bonjour Sophie, dernière relance concernant votre demande de transport scolaire. Sans retour de votre part d'ici 2 jours, nous clôturerons le dossier. Nous restons disponibles.",
      },
    ])
    assertOk(e4, 'relances 3')

    console.log('✓ Scénario 3 — statut: relance_2')
    console.log('  Lyon → Bordeaux | 55 pass. | aller-retour | 550 km + guide | 4 673 € TTC')
    console.log('  → n8n doit clôturer (statut: cloture) dans 2 jours\n')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCÉNARIO 4 — statut: accepte (contrôle négatif)
  // n8n NE doit PAS relancer ce devis
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const { data: lead, error: e1 } = await supabase.from('leads').insert({
      prenom: 'Jean', nom: 'Leblanc', email: 'xbev4@protonmail.com',
      telephone: '0698765432', societe: 'Agence Tourisme Alsace',
      type_client: 'entreprise',
    }).select().single()
    assertOk(e1, 'lead 4')

    const { data: dem, error: e2 } = await supabase.from('demandes').insert({
      lead_id: lead!.id,
      ville_depart: 'Paris', ville_arrivee: 'Strasbourg',
      date_depart: daysFrom(18), date_arrivee: daysFrom(20),
      aller_retour: true, nb_passagers: 30, type_trajet: 'circuit_touristique',
      urgence_code: 'DD_URGENT',
      details_json: { km_distance: 490, nuit_chauffeur: true, guide: false, peages: 0 },
      score_completude: 1.0, type_statut: 'demande_qualifiee',
    }).select().single()
    assertOk(e2, 'demande 4')

    const { error: e3 } = await supabase.from('devis').insert({
      demande_id: dem!.id,
      coeff_saisonnalite: 0.10, coeff_capacite: 0.00, coeff_delai: 0.05,
      supplement: 120, marge: 0.20,
      montant_ht: 3073, taux_tva: 0.20, montant_tva: 615, montant_ttc: 3688,
      statut: 'accepte',
      date_envoi: daysAgo(5),
      mode_generation: 'DETERMINISTE',
      nb_relance: 0,
      prochaine_relance: null,
    })
    assertOk(e3, 'devis 4')

    console.log('✓ Scénario 4 — statut: accepte (contrôle négatif n8n)')
    console.log('  Paris → Strasbourg | 30 pass. | aller-retour | 490 km | 3 688 € TTC\n')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCÉNARIO 5 — statut: refuse (contrôle négatif)
  // n8n NE doit PAS relancer ce devis
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const { data: lead, error: e1 } = await supabase.from('leads').insert({
      prenom: 'Claire', nom: 'Moreau', email: 'xbev4@protonmail.com',
      telephone: '0645678901',
      type_client: 'particulier',
    }).select().single()
    assertOk(e1, 'lead 5')

    const { data: dem, error: e2 } = await supabase.from('demandes').insert({
      lead_id: lead!.id,
      ville_depart: 'Nice', ville_arrivee: 'Monaco',
      date_depart: daysFrom(13), date_arrivee: daysFrom(13),
      aller_retour: false, nb_passagers: 15, type_trajet: 'transfert',
      urgence_code: 'DD_URGENT',
      details_json: { km_distance: 20, nuit_chauffeur: false, guide: false, peages: 0 },
      score_completude: 0.9, type_statut: 'demande_qualifiee',
    }).select().single()
    assertOk(e2, 'demande 5')

    const { error: e3 } = await supabase.from('devis').insert({
      demande_id: dem!.id,
      coeff_saisonnalite: 0.15, coeff_capacite: -0.05, coeff_delai: 0.05,
      supplement: 0, marge: 0.20,
      montant_ht: 298, taux_tva: 0.20, montant_tva: 60, montant_ttc: 358,
      statut: 'refuse',
      date_envoi: daysAgo(3),
      mode_generation: 'DETERMINISTE',
      nb_relance: 0,
      prochaine_relance: null,
    })
    assertOk(e3, 'devis 5')

    console.log('✓ Scénario 5 — statut: refuse (contrôle négatif n8n)')
    console.log('  Nice → Monaco | 15 pass. | aller simple | 20 km | 358 € TTC\n')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCÉNARIO 6 — DD_PRIORITAIRE (départ demain)
  // Dashboard : notification rouge · alerte commerciale immédiate
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const { data: lead, error: e1 } = await supabase.from('leads').insert({
      prenom: 'Thomas', nom: 'Roux', email: 'xbev4@protonmail.com',
      telephone: '0677889900', societe: 'Comité d\'entreprise Roux',
      type_client: 'entreprise',
    }).select().single()
    assertOk(e1, 'lead 6')

    const { data: dem, error: e2 } = await supabase.from('demandes').insert({
      lead_id: lead!.id,
      ville_depart: 'Lyon', ville_arrivee: 'Genève',
      date_depart: daysFrom(1), date_arrivee: daysFrom(1),
      aller_retour: false, nb_passagers: 40, type_trajet: 'transfert',
      urgence_code: 'DD_PRIORITAIRE',
      details_json: { km_distance: 155, nuit_chauffeur: false, guide: false, peages: 0 },
      score_completude: 1.0, type_statut: 'demande_qualifiee',
    }).select().single()
    assertOk(e2, 'demande 6')

    const { error: e3 } = await supabase.from('devis').insert({
      demande_id: dem!.id,
      coeff_saisonnalite: 0.00, coeff_capacite: 0.00, coeff_delai: 0.10,
      supplement: 0, marge: 0.20,
      montant_ht: 1014, taux_tva: 0.20, montant_tva: 203, montant_ttc: 1217,
      statut: 'envoye',
      date_envoi: daysAgo(0),
      mode_generation: 'DETERMINISTE',
      nb_relance: 0,
      prochaine_relance: daysFrom(7),
    })
    assertOk(e3, 'devis 6')

    console.log('✓ Scénario 6 — DD_PRIORITAIRE (dashboard : alerte rouge)')
    console.log('  Lyon → Genève | 40 pass. | départ demain | 1 217 € TTC\n')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCÉNARIO 7 — DD_URGENT (départ dans 4 jours)
  // Dashboard : notification orange · à traiter rapidement
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const { data: lead, error: e1 } = await supabase.from('leads').insert({
      prenom: 'Isabelle', nom: 'Faure', email: 'xbev4@protonmail.com',
      telephone: '0654321098', societe: 'École Primaire Voltaire',
      type_client: 'association',
    }).select().single()
    assertOk(e1, 'lead 7')

    const { data: dem, error: e2 } = await supabase.from('demandes').insert({
      lead_id: lead!.id,
      ville_depart: 'Bordeaux', ville_arrivee: 'Arcachon',
      date_depart: daysFrom(4), date_arrivee: daysFrom(4),
      aller_retour: false, nb_passagers: 55, type_trajet: 'sortie_scolaire',
      urgence_code: 'DD_URGENT',
      details_json: { km_distance: 65, nuit_chauffeur: false, guide: true, peages: 0 },
      score_completude: 1.0, type_statut: 'demande_qualifiee',
    }).select().single()
    assertOk(e2, 'demande 7')

    const { error: e3 } = await supabase.from('devis').insert({
      demande_id: dem!.id,
      coeff_saisonnalite: 0.00, coeff_capacite: 0.15, coeff_delai: 0.05,
      supplement: 80, marge: 0.20,
      montant_ht: 672, taux_tva: 0.20, montant_tva: 134, montant_ttc: 806,
      statut: 'envoye',
      date_envoi: daysAgo(0),
      mode_generation: 'DETERMINISTE',
      nb_relance: 0,
      prochaine_relance: daysFrom(7),
    })
    assertOk(e3, 'devis 7')

    console.log('✓ Scénario 7 — DD_URGENT (dashboard : alerte orange)')
    console.log('  Bordeaux → Arcachon | 55 pass. | départ J+4 | 806 € TTC\n')
  }

  console.log('─'.repeat(60))
  console.log('✅ Seed terminé — 7 scénarios insérés')
  console.log()
  console.log('Filtre n8n à configurer :')
  console.log("  SELECT * FROM devis")
  console.log("  WHERE statut IN ('envoye', 'relance_1', 'relance_2')")
  console.log("  AND prochaine_relance <= NOW()")
}

await reset()
await seed()
