-- ============================================================
-- NeoTravel — Seed démonstration  (4 étapes séquentielles)
-- Coller et exécuter UNE étape à la fois dans Supabase SQL Editor
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- ÉTAPE 1 — Nettoyage (ordre FK : relances → devis → demandes → leads)
-- ════════════════════════════════════════════════════════════
DELETE FROM relances;
DELETE FROM devis;
DELETE FROM demandes;
DELETE FROM leads;


-- ════════════════════════════════════════════════════════════
-- ÉTAPE 2 — Leads
-- Vérifier ensuite : SELECT id, prenom, nom, email FROM leads;
-- ════════════════════════════════════════════════════════════
-- Tous les emails pointent vers la même boîte de test (xbev4@protonmail.com)
-- Le lookup lead_id se fait via prenom+nom (unique dans ce seed)
INSERT INTO leads (prenom, nom, email, telephone, societe, type_client, created_at) VALUES
  ('Jean',     'Dupont',    'xbev4@protonmail.com', '0601020304', NULL,                           'particulier',    NOW()),
  ('Hélène',   'Moreau',    'xbev4@protonmail.com', '0102030405', 'Mairie de Paris',              'institutionnel', NOW()),
  ('Sophie',   'Martin',    'xbev4@protonmail.com', '0607080910', 'Agence Voyage Plus',           'pro',            NOW() - INTERVAL '6 days'),
  ('Marc',     'Dubois',    'xbev4@protonmail.com', '0611223344', 'Club Sportif Olympia',         'association',    NOW() - INTERVAL '4 days'),
  ('Isabelle', 'Petit',     'xbev4@protonmail.com', '0622334455', 'CE SNCF',                      'entreprise',     NOW() - INTERVAL '12 days'),
  ('Thomas',   'Bernard',   'xbev4@protonmail.com', '0633445566', 'Bouygues Construction',        'entreprise',     NOW() - INTERVAL '18 days'),
  ('Paul',     'Leblanc',   'xbev4@protonmail.com', '0644556677', NULL,                           'particulier',    NOW() - INTERVAL '20 days'),
  ('Lucie',    'Chevalier', 'xbev4@protonmail.com', '0655667788', 'Association Tourisme 13',      'association',    NOW() - INTERVAL '50 days'),
  ('Antoine',  'Rousseau',  'xbev4@protonmail.com', '0666778899', 'Festival Vieilles Charrues',   'association',    NOW() - INTERVAL '8 days'),
  ('Nadia',    'Fontaine',  'xbev4@protonmail.com', '0677889900', 'Office Tourisme Marseille',    'institutionnel', NOW() - INTERVAL '30 days');

-- Vérification étape 2 :
SELECT id, prenom, nom, email FROM leads ORDER BY id;


-- ════════════════════════════════════════════════════════════
-- ÉTAPE 3 — Demandes (utilise les emails pour résoudre les lead_id)
-- Vérifier ensuite : SELECT id, lead_id, ville_depart, ville_arrivee FROM demandes;
-- ════════════════════════════════════════════════════════════
INSERT INTO demandes
  (lead_id, ville_depart, ville_arrivee, date_depart, date_arrivee,
   aller_retour, nb_passagers, type_trajet, urgence_code,
   details_json, score_completude, type_statut, commentaire)
VALUES
  -- 1. Paris → Lyon · A/R · 30 pax  [relance J-4]
  ((SELECT id FROM leads WHERE prenom = 'Sophie' AND nom = 'Martin'),
   'Paris', 'Lyon', '2026-09-15', '2026-09-16',
   true, 30, 'standard', 'DD_NORMAL',
   '{"km_distance":488,"peages":177.6}', 1.0, 'demande_qualifiee', NULL),

  -- 2. Paris → Bordeaux · aller simple · 55 pax  [relance J-2]
  ((SELECT id FROM leads WHERE prenom = 'Marc' AND nom = 'Dubois'),
   'Paris', 'Bordeaux', '2026-08-20', '2026-08-20',
   false, 55, 'standard', 'DD_NORMAL',
   '{"km_distance":583,"peages":48.7}', 1.0, 'demande_qualifiee', NULL),

  -- 3. Lyon → Marseille · A/R · 28 pax  [relance J-1]
  ((SELECT id FROM leads WHERE prenom = 'Isabelle' AND nom = 'Petit'),
   'Lyon', 'Marseille', '2026-07-14', '2026-07-15',
   true, 28, 'standard', 'DD_URGENT',
   '{"km_distance":315,"peages":58.4}', 1.0, 'demande_qualifiee', NULL),

  -- 4. Paris → Nice · A/R · 45 pax  [accepté]
  ((SELECT id FROM leads WHERE prenom = 'Hélène' AND nom = 'Moreau'),
   'Paris', 'Nice', '2026-07-05', '2026-07-06',
   true, 45, 'standard', 'DD_NORMAL',
   '{"km_distance":930,"peages":198.6}', 1.0, 'demande_qualifiee', NULL),

  -- 5. Bordeaux → Biarritz · aller simple · 20 pax  [accepté]
  ((SELECT id FROM leads WHERE prenom = 'Thomas' AND nom = 'Bernard'),
   'Bordeaux', 'Biarritz', '2026-09-05', '2026-09-05',
   false, 20, 'standard', 'DD_3MOISETPLUS',
   '{"km_distance":190,"peages":12.4}', 1.0, 'demande_qualifiee', NULL),

  -- 6. Marseille → Nice · aller simple · 12 pax  [refusé]
  ((SELECT id FROM leads WHERE prenom = 'Nadia' AND nom = 'Fontaine'),
   'Marseille', 'Nice', '2026-08-10', '2026-08-10',
   false, 12, 'standard', 'DD_NORMAL',
   '{"km_distance":200,"peages":18.2}', 1.0, 'demande_qualifiee', NULL),

  -- 7. Nantes → La Rochelle · aller simple · 35 pax  [clôturé]
  ((SELECT id FROM leads WHERE prenom = 'Lucie' AND nom = 'Chevalier'),
   'Nantes', 'La Rochelle', '2026-05-15', '2026-05-15',
   false, 35, 'standard', 'DD_NORMAL',
   '{"km_distance":150,"peages":0}', 1.0, 'demande_qualifiee', NULL),

  -- 8. Paris → Strasbourg · A/R · 35 pax  [envoye récent, relance J+5]
  ((SELECT id FROM leads WHERE prenom = 'Jean' AND nom = 'Dupont'),
   'Paris', 'Strasbourg', '2026-09-10', '2026-09-11',
   true, 35, 'standard', 'DD_NORMAL',
   '{"km_distance":490,"peages":62.8}', 1.0, 'demande_qualifiee', NULL),

  -- 9. Bordeaux → ? · demande incomplète · pas de devis
  ((SELECT id FROM leads WHERE prenom = 'Paul' AND nom = 'Leblanc'),
   'Bordeaux', '?', '2026-08-01', '2026-08-01',
   false, 0, 'standard', 'DD_NORMAL',
   '{}', 0.4, 'demande_incomplete', 'Destination non précisée, nombre de passagers inconnu'),

  -- 10. Paris → Carhaix · 80 pax · cas complexe HITL · pas de devis
  ((SELECT id FROM leads WHERE prenom = 'Antoine' AND nom = 'Rousseau'),
   'Paris', 'Carhaix-Plouguer', '2026-07-20', '2026-07-22',
   true, 80, 'standard', 'DD_NORMAL',
   '{"km_distance":540,"peages":68.2}', 1.0, 'cas_complexe',
   'HITL requis : 80 passagers — escalade commerciale');

-- Vérification étape 3 :
SELECT d.id, l.email, d.ville_depart, d.ville_arrivee, d.type_statut
FROM demandes d JOIN leads l ON l.id = d.lead_id
ORDER BY d.id;


-- ════════════════════════════════════════════════════════════
-- ÉTAPE 4 — Devis (joint demandes + leads pour résoudre demande_id)
-- ════════════════════════════════════════════════════════════
INSERT INTO devis
  (demande_id,
   coeff_saisonnalite, coeff_capacite, coeff_delai,
   supplement, marge,
   montant_ht, taux_tva, montant_tva, montant_ttc,
   statut, date_envoi, mode_generation, nb_relance, prochaine_relance)
VALUES
  -- 1. Paris → Lyon · envoye · relance J-4  ← n8n doit déclencher
  ((SELECT d.id FROM demandes d JOIN leads l ON l.id = d.lead_id WHERE l.prenom = 'Sophie' AND l.nom = 'Martin' LIMIT 1),
   0, 0, -0.05, 297.6, 0.15,
   2869.94, 0.10, 286.99, 3156.93,
   'envoye', NOW() - INTERVAL '11 days', 'DETERMINISTE', 0, NOW() - INTERVAL '4 days'),

  -- 2. Paris → Bordeaux · envoye · relance J-2  ← n8n doit déclencher
  ((SELECT d.id FROM demandes d JOIN leads l ON l.id = d.lead_id WHERE l.prenom = 'Marc' AND l.nom = 'Dubois' LIMIT 1),
   -0.07, 0.15, -0.05, 48.7, 0.15,
   2286.80, 0.10, 228.68, 2515.48,
   'envoye', NOW() - INTERVAL '9 days', 'DETERMINISTE', 0, NOW() - INTERVAL '2 days'),

  -- 3. Lyon → Marseille · envoye · relance J-1  ← n8n doit déclencher
  ((SELECT d.id FROM demandes d JOIN leads l ON l.id = d.lead_id WHERE l.prenom = 'Isabelle' AND l.nom = 'Petit' LIMIT 1),
   0.10, 0, 0.05, 236.8, 0.15,
   2199.23, 0.10, 219.92, 2419.15,
   'envoye', NOW() - INTERVAL '7 days', 'DETERMINISTE', 0, NOW() - INTERVAL '1 day'),

  -- 4. Paris → Nice · accepté
  ((SELECT d.id FROM demandes d JOIN leads l ON l.id = d.lead_id WHERE l.prenom = 'Hélène' AND l.nom = 'Moreau' LIMIT 1),
   0.10, 0, -0.05, 517.2, 0.15,
   5774.40, 0.10, 577.44, 6351.84,
   'accepte', NOW() - INTERVAL '21 days', 'DETERMINISTE', 1, NULL),

  -- 5. Bordeaux → Biarritz · accepté
  ((SELECT d.id FROM demandes d JOIN leads l ON l.id = d.lead_id WHERE l.prenom = 'Thomas' AND l.nom = 'Bernard' LIMIT 1),
   0, 0, -0.10, 12.4, 0.15,
   515.66, 0.10, 51.57, 567.23,
   'accepte', NOW() - INTERVAL '25 days', 'DETERMINISTE', 0, NULL),

  -- 6. Marseille → Nice · refusé
  ((SELECT d.id FROM demandes d JOIN leads l ON l.id = d.lead_id WHERE l.prenom = 'Nadia' AND l.nom = 'Fontaine' LIMIT 1),
   -0.07, -0.05, -0.05, 18.2, 0.15,
   582.12, 0.10, 58.21, 640.33,
   'refuse', NOW() - INTERVAL '35 days', 'DETERMINISTE', 2, NULL),

  -- 7. Nantes → La Rochelle · clôturé
  ((SELECT d.id FROM demandes d JOIN leads l ON l.id = d.lead_id WHERE l.prenom = 'Lucie' AND l.nom = 'Chevalier' LIMIT 1),
   0.15, 0, -0.05, 0, 0.15,
   1034.63, 0.10, 103.46, 1138.09,
   'cloture', NOW() - INTERVAL '55 days', 'DETERMINISTE', 2, NULL),

  -- 8. Paris → Strasbourg · envoye récent · relance J+5  (pas encore due)
  ((SELECT d.id FROM demandes d JOIN leads l ON l.id = d.lead_id WHERE l.prenom = 'Jean' AND l.nom = 'Dupont' LIMIT 1),
   0, 0, -0.05, 245.6, 0.15,
   2999.61, 0.10, 299.96, 3299.57,
   'envoye', NOW() - INTERVAL '2 days', 'DETERMINISTE', 0, NOW() + INTERVAL '5 days');

-- Vérification finale :
SELECT 'leads'           AS table_name, COUNT(*) AS total FROM leads
UNION ALL
SELECT 'demandes',                       COUNT(*) FROM demandes
UNION ALL
SELECT 'devis',                          COUNT(*) FROM devis
UNION ALL
SELECT 'relances_dues_n8n',              COUNT(*) FROM devis
  WHERE statut = 'envoye' AND prochaine_relance <= NOW();
