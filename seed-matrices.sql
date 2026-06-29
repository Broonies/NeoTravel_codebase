-- Seed matrices NeoTravel — à exécuter une seule fois dans le SQL Editor Supabase
-- Tables : matrices(id, type, valeur_min, valeur_max, coefficient, prix_base)

INSERT INTO matrices (type, valeur_min, valeur_max, coefficient, prix_base) VALUES
-- Base (forfait ≤ 180 km)
('base',  0,   10,    0,    250),
('base',  11,  20,    0,    250),
('base',  21,  30,    0,    250),
('base',  31,  40,    0,    320),
('base',  41,  50,    0,    350),
('base',  51,  60,    0,    390),
('base',  61,  70,    0,    430),
('base',  71,  80,    0,    500),
('base',  81,  90,    0,    540),
('base',  91,  100,   0,    580),
('base',  101, 110,   0,    620),
('base',  111, 120,   0,    660),
('base',  121, 130,   0,    700),
('base',  131, 140,   0,    740),
('base',  141, 150,   0,    780),
('base',  151, 160,   0,    820),
('base',  161, 170,   0,    860),
('base',  171, 180,   0,    900),
-- >180 km : prix = km × 2.5 €/km (aller simple)
('base',  181, 99999, 2.5,  0),

-- Saisonnalité (valeur = numéro de mois)
('saisonnalite', 1,  1,  -0.07, 0),  -- janvier   basse -7%
('saisonnalite', 2,  2,  -0.07, 0),  -- février   basse -7%
('saisonnalite', 3,  3,   0.10, 0),  -- mars      haute +10%
('saisonnalite', 4,  4,   0.10, 0),  -- avril     haute +10%
('saisonnalite', 5,  5,   0.15, 0),  -- mai       très haute +15%
('saisonnalite', 6,  6,   0.15, 0),  -- juin      très haute +15%
('saisonnalite', 7,  7,   0.10, 0),  -- juillet   haute +10%
('saisonnalite', 8,  8,  -0.07, 0),  -- août      basse -7%
('saisonnalite', 9,  9,   0,    0),  -- septembre normale 0%
('saisonnalite', 10, 10,  0,    0),  -- octobre   normale 0%
('saisonnalite', 11, 11, -0.07, 0),  -- novembre  basse -7%
('saisonnalite', 12, 12,  0,    0),  -- décembre  normale 0%

-- Capacité (valeur = nb passagers)
('capacite', 1,  19, -0.05, 0),
('capacite', 20, 53,  0,    0),
('capacite', 54, 63,  0.15, 0),
('capacite', 64, 67,  0.20, 0),
('capacite', 68, 85,  0.40, 0),

-- Délai demande → départ (valeur = jours avant départ)
('delai', 0,  1,      0.10, 0),   -- prioritaire  +10%
('delai', 2,  7,      0.05, 0),   -- urgent       +5%
('delai', 8,  90,    -0.05, 0),   -- normal       -5%
('delai', 91, 99999, -0.10, 0),   -- anticipé     -10%

-- Suppléments (valeur_min = identifiant : 1=guide, 2=nuit_chauffeur)
('supplement', 1, 1, 0, 80),   -- guide touristique 80€/jour
('supplement', 2, 2, 0, 120);  -- nuit chauffeur 120€/nuit
