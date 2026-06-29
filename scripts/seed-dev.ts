import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local')
  process.exit(1)
}

const sb = createClient(url, key, { auth: { persistSession: false } })

const TODAY = '2026-06-29'

function daysAgo(n: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function relanceDate(daysOffset: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + daysOffset)
  return d.toISOString()
}

async function insert<T>(table: string, data: object): Promise<T> {
  const { data: row, error } = await sb.from(table).insert(data).select().single()
  if (error) throw new Error(`[${table}] ${error.message}`)
  return row as T
}

async function seed() {
  console.log('\n🌱 Nettoyage des tables...')
  for (const table of ['devis', 'demandes', 'leads']) {
    const { error } = await sb.from(table).delete().neq('id', 0)
    if (error) throw new Error(`Nettoyage ${table}: ${error.message}`)
  }
  console.log('   ✅ Tables vidées')

  // ── Leads ──────────────────────────────────────────────────────────────────
  console.log('\n👤 Insertion des leads...')

  const leads = {
    dupont:     await insert<{ id: number }>('leads', { prenom: 'Jean',     nom: 'Dupont',    email: 'jean.dupont@gmail.com',               telephone: '0601020304', type_client: 'particulier' }),
    moreau:     await insert<{ id: number }>('leads', { prenom: 'Hélène',   nom: 'Moreau',    email: 'h.moreau@mairie-paris.fr',            telephone: '0102030405', societe: 'Mairie de Paris',           type_client: 'institutionnel' }),
    voyage:     await insert<{ id: number }>('leads', { prenom: 'Sophie',   nom: 'Martin',    email: 'sophie@agencevoyageplus.fr',          telephone: '0607080910', societe: 'Agence Voyage Plus',        type_client: 'pro',           created_at: daysAgo(6) }),
    olympia:    await insert<{ id: number }>('leads', { prenom: 'Marc',     nom: 'Dubois',    email: 'm.dubois@clubolympia.fr',             telephone: '0611223344', societe: 'Club Sportif Olympia',      type_client: 'association',   created_at: daysAgo(4) }),
    sncf:       await insert<{ id: number }>('leads', { prenom: 'Isabelle', nom: 'Petit',     email: 'isabelle.petit@ce-sncf.fr',          telephone: '0622334455', societe: 'CE SNCF',                   type_client: 'entreprise',    created_at: daysAgo(12) }),
    bouygues:   await insert<{ id: number }>('leads', { prenom: 'Thomas',   nom: 'Bernard',   email: 't.bernard@bouygues.com',             telephone: '0633445566', societe: 'Bouygues Construction',     type_client: 'entreprise',    created_at: daysAgo(18) }),
    leblanc:    await insert<{ id: number }>('leads', { prenom: 'Paul',     nom: 'Leblanc',   email: 'paul.leblanc@hotmail.com',           telephone: '0644556677', type_client: 'particulier',           created_at: daysAgo(20) }),
    asso13:     await insert<{ id: number }>('leads', { prenom: 'Lucie',    nom: 'Chevalier', email: 'lucie@asso-tourisme13.fr',           telephone: '0655667788', societe: 'Association Tourisme 13',   type_client: 'association',   created_at: daysAgo(50) }),
    charrues:   await insert<{ id: number }>('leads', { prenom: 'Antoine',  nom: 'Rousseau',  email: 'contact@festival-vieillescharrues.fr',telephone: '0666778899', societe: 'Festival Vieilles Charrues',type_client: 'association',  created_at: daysAgo(8) }),
    tourisme:   await insert<{ id: number }>('leads', { prenom: 'Nadia',    nom: 'Fontaine',  email: 'nadia@tourisme-marseille.fr',        telephone: '0677889900', societe: 'Office Tourisme Marseille', type_client: 'institutionnel',created_at: daysAgo(30) }),
  }
  console.log(`   ✅ ${Object.keys(leads).length} leads insérés`)

  // ── Demandes + Devis ───────────────────────────────────────────────────────
  console.log('\n📋 Insertion des demandes et devis...\n')

  // ── 1. RELANCE EN RETARD #1 ── Paris → Lyon · 30 pax · A/R ───────────────
  //    prochaine_relance: il y a 4 jours → doit apparaître dans n8n
  {
    const d = await insert<{ id: number }>('demandes', {
      lead_id: leads.voyage.id, ville_depart: 'Paris', ville_arrivee: 'Lyon',
      date_depart: '2026-09-15', date_arrivee: '2026-09-16',
      aller_retour: true, nb_passagers: 30, type_trajet: 'standard',
      urgence_code: 'DD_NORMAL', score_completude: 1.0, type_statut: 'demande_qualifiee',
      details_json: { km_distance: 488, peages: 177.6 },
    })
    await insert('devis', {
      demande_id: d.id,
      coeff_saisonnalite: 0, coeff_capacite: 0, coeff_delai: -0.05,
      supplement: 297.6, marge: 0.15,
      montant_ht: 2869.94, taux_tva: 0.10, montant_tva: 286.99, montant_ttc: 3156.93,
      statut: 'envoye', date_envoi: daysAgo(11), mode_generation: 'DETERMINISTE',
      nb_relance: 0, prochaine_relance: relanceDate(-4),
    })
    console.log('   ✅ [1] Paris → Lyon · relance J-4 · 3 156,93 €')
  }

  // ── 2. RELANCE EN RETARD #2 ── Paris → Bordeaux · 55 pax · aller simple ──
  //    prochaine_relance: il y a 2 jours
  {
    const d = await insert<{ id: number }>('demandes', {
      lead_id: leads.olympia.id, ville_depart: 'Paris', ville_arrivee: 'Bordeaux',
      date_depart: '2026-08-20', date_arrivee: '2026-08-20',
      aller_retour: false, nb_passagers: 55, type_trajet: 'standard',
      urgence_code: 'DD_NORMAL', score_completude: 1.0, type_statut: 'demande_qualifiee',
      details_json: { km_distance: 583, peages: 48.7 },
    })
    await insert('devis', {
      demande_id: d.id,
      coeff_saisonnalite: -0.07, coeff_capacite: 0.15, coeff_delai: -0.05,
      supplement: 48.7, marge: 0.15,
      montant_ht: 2286.80, taux_tva: 0.10, montant_tva: 228.68, montant_ttc: 2515.48,
      statut: 'envoye', date_envoi: daysAgo(9), mode_generation: 'DETERMINISTE',
      nb_relance: 0, prochaine_relance: relanceDate(-2),
    })
    console.log('   ✅ [2] Paris → Bordeaux · relance J-2 · 2 515,48 €')
  }

  // ── 3. RELANCE EN RETARD #3 ── Lyon → Marseille · 28 pax · A/R ────────────
  //    prochaine_relance: hier
  {
    const d = await insert<{ id: number }>('demandes', {
      lead_id: leads.sncf.id, ville_depart: 'Lyon', ville_arrivee: 'Marseille',
      date_depart: '2026-07-14', date_arrivee: '2026-07-15',
      aller_retour: true, nb_passagers: 28, type_trajet: 'standard',
      urgence_code: 'DD_URGENT', score_completude: 1.0, type_statut: 'demande_qualifiee',
      details_json: { km_distance: 315, peages: 58.4 },
    })
    await insert('devis', {
      demande_id: d.id,
      coeff_saisonnalite: 0.10, coeff_capacite: 0, coeff_delai: 0.05,
      supplement: 236.8, marge: 0.15,
      montant_ht: 2199.23, taux_tva: 0.10, montant_tva: 219.92, montant_ttc: 2419.15,
      statut: 'envoye', date_envoi: daysAgo(7), mode_generation: 'DETERMINISTE',
      nb_relance: 0, prochaine_relance: relanceDate(-1),
    })
    console.log('   ✅ [3] Lyon → Marseille · relance J-1 · 2 419,15 €')
  }

  // ── 4. ACCEPTÉ #1 ── Paris → Nice · 45 pax · A/R ─────────────────────────
  {
    const d = await insert<{ id: number }>('demandes', {
      lead_id: leads.moreau.id, ville_depart: 'Paris', ville_arrivee: 'Nice',
      date_depart: '2026-07-05', date_arrivee: '2026-07-06',
      aller_retour: true, nb_passagers: 45, type_trajet: 'standard',
      urgence_code: 'DD_NORMAL', score_completude: 1.0, type_statut: 'demande_qualifiee',
      details_json: { km_distance: 930, peages: 198.6 },
    })
    await insert('devis', {
      demande_id: d.id,
      coeff_saisonnalite: 0.10, coeff_capacite: 0, coeff_delai: -0.05,
      supplement: 517.2, marge: 0.15,
      montant_ht: 5774.40, taux_tva: 0.10, montant_tva: 577.44, montant_ttc: 6351.84,
      statut: 'accepte', date_envoi: daysAgo(21), mode_generation: 'DETERMINISTE',
      nb_relance: 1, prochaine_relance: null,
    })
    console.log('   ✅ [4] Paris → Nice · accepté · 6 351,84 €')
  }

  // ── 5. ACCEPTÉ #2 ── Bordeaux → Biarritz · 20 pax · aller simple ─────────
  {
    const d = await insert<{ id: number }>('demandes', {
      lead_id: leads.bouygues.id, ville_depart: 'Bordeaux', ville_arrivee: 'Biarritz',
      date_depart: '2026-09-05', date_arrivee: '2026-09-05',
      aller_retour: false, nb_passagers: 20, type_trajet: 'standard',
      urgence_code: 'DD_3MOISETPLUS', score_completude: 1.0, type_statut: 'demande_qualifiee',
      details_json: { km_distance: 190, peages: 12.4 },
    })
    await insert('devis', {
      demande_id: d.id,
      coeff_saisonnalite: 0, coeff_capacite: 0, coeff_delai: -0.10,
      supplement: 12.4, marge: 0.15,
      montant_ht: 515.66, taux_tva: 0.10, montant_tva: 51.57, montant_ttc: 567.23,
      statut: 'accepte', date_envoi: daysAgo(25), mode_generation: 'DETERMINISTE',
      nb_relance: 0, prochaine_relance: null,
    })
    console.log('   ✅ [5] Bordeaux → Biarritz · accepté · 567,23 €')
  }

  // ── 6. REFUSÉ ── Marseille → Nice · 12 pax · aller simple ────────────────
  {
    const d = await insert<{ id: number }>('demandes', {
      lead_id: leads.tourisme.id, ville_depart: 'Marseille', ville_arrivee: 'Nice',
      date_depart: '2026-08-10', date_arrivee: '2026-08-10',
      aller_retour: false, nb_passagers: 12, type_trajet: 'standard',
      urgence_code: 'DD_NORMAL', score_completude: 1.0, type_statut: 'demande_qualifiee',
      details_json: { km_distance: 200, peages: 18.2 },
    })
    await insert('devis', {
      demande_id: d.id,
      coeff_saisonnalite: -0.07, coeff_capacite: -0.05, coeff_delai: -0.05,
      supplement: 18.2, marge: 0.15,
      montant_ht: 582.12, taux_tva: 0.10, montant_tva: 58.21, montant_ttc: 640.33,
      statut: 'refuse', date_envoi: daysAgo(35), mode_generation: 'DETERMINISTE',
      nb_relance: 2, prochaine_relance: null,
    })
    console.log('   ✅ [6] Marseille → Nice · refusé · 640,33 €')
  }

  // ── 7. CLÔTURÉ ── Nantes → La Rochelle · 35 pax · aller simple ───────────
  {
    const d = await insert<{ id: number }>('demandes', {
      lead_id: leads.asso13.id, ville_depart: 'Nantes', ville_arrivee: 'La Rochelle',
      date_depart: '2026-05-15', date_arrivee: '2026-05-15',
      aller_retour: false, nb_passagers: 35, type_trajet: 'standard',
      urgence_code: 'DD_NORMAL', score_completude: 1.0, type_statut: 'demande_qualifiee',
      details_json: { km_distance: 150, peages: 0 },
    })
    await insert('devis', {
      demande_id: d.id,
      coeff_saisonnalite: 0.15, coeff_capacite: 0, coeff_delai: -0.05,
      supplement: 0, marge: 0.15,
      montant_ht: 1034.63, taux_tva: 0.10, montant_tva: 103.46, montant_ttc: 1138.09,
      statut: 'cloture', date_envoi: daysAgo(55), mode_generation: 'DETERMINISTE',
      nb_relance: 2, prochaine_relance: null,
    })
    console.log('   ✅ [7] Nantes → La Rochelle · clôturé · 1 138,09 €')
  }

  // ── 8. ENVOYE RÉCENT ── Paris → Strasbourg · 35 pax · A/R ────────────────
  //    prochaine_relance: dans 5 jours (pas encore due)
  {
    const d = await insert<{ id: number }>('demandes', {
      lead_id: leads.dupont.id, ville_depart: 'Paris', ville_arrivee: 'Strasbourg',
      date_depart: '2026-09-10', date_arrivee: '2026-09-11',
      aller_retour: true, nb_passagers: 35, type_trajet: 'standard',
      urgence_code: 'DD_NORMAL', score_completude: 1.0, type_statut: 'demande_qualifiee',
      details_json: { km_distance: 490, peages: 62.8 },
    })
    await insert('devis', {
      demande_id: d.id,
      coeff_saisonnalite: 0, coeff_capacite: 0, coeff_delai: -0.05,
      supplement: 245.6, marge: 0.15,
      montant_ht: 2999.61, taux_tva: 0.10, montant_tva: 299.96, montant_ttc: 3299.57,
      statut: 'envoye', date_envoi: daysAgo(2), mode_generation: 'DETERMINISTE',
      nb_relance: 0, prochaine_relance: relanceDate(5),
    })
    console.log('   ✅ [8] Paris → Strasbourg · envoye · relance J+5 · 3 299,57 €')
  }

  // ── 9. DEMANDE INCOMPLÈTE ── sans devis ───────────────────────────────────
  {
    await insert('demandes', {
      lead_id: leads.leblanc.id, ville_depart: 'Bordeaux', ville_arrivee: '?',
      date_depart: '2026-08-01', date_arrivee: '2026-08-01',
      aller_retour: false, nb_passagers: 0, type_trajet: 'standard',
      urgence_code: 'DD_NORMAL', score_completude: 0.4, type_statut: 'demande_incomplete',
      details_json: {}, commentaire: 'Destination non précisée, nb passagers inconnu',
    })
    console.log('   ✅ [9] Bordeaux → ? · demande_incomplete · pas de devis')
  }

  // ── 10. CAS COMPLEXE / HITL ── 80 pax → escalade commerciale ─────────────
  {
    await insert('demandes', {
      lead_id: leads.charrues.id, ville_depart: 'Paris', ville_arrivee: 'Carhaix-Plouguer',
      date_depart: '2026-07-20', date_arrivee: '2026-07-22',
      aller_retour: true, nb_passagers: 80, type_trajet: 'standard',
      urgence_code: 'DD_NORMAL', score_completude: 1.0, type_statut: 'cas_complexe',
      details_json: { km_distance: 540, peages: 68.2 },
      commentaire: 'HITL requis : 80 passagers > seuil 85 — escalade commerciale',
    })
    console.log('   ✅ [10] Paris → Carhaix · cas_complexe · 80 pax HITL · pas de devis')
  }

  // ── Résumé ─────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────')
  console.log('🎉 Seed terminé')
  console.log('   Leads          : 10 (dont 2 aujourd\'hui)')
  console.log('   Demandes       : 10')
  console.log('   Devis          : 8')
  console.log('   ├─ envoye      : 4 (dont 3 relances en retard pour n8n)')
  console.log('   ├─ accepte     : 2  →  CA total ≈ 6 919 €')
  console.log('   ├─ refuse      : 1')
  console.log('   └─ cloture     : 1')
  console.log('   Sans devis     : 2 (demande_incomplete + cas_complexe)')
  console.log('─────────────────────────────────────────────\n')
}

seed().catch(err => {
  console.error('❌ Seed échoué :', err.message)
  process.exit(1)
})
