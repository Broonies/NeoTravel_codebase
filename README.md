# NeoTravel — Agent de devis autocar

Application Next.js intégrant un agent IA pour automatiser la captation, la qualification et le chiffrage des demandes de transport en autocar.

---

## Architecture

```
Client (Next.js App Router)
│
├── /chat          — Interface conversationnelle (Vercel AI SDK v6 + useChat)
├── /devis         — Simulateur de devis formulaire (Server Action)
├── /dashboard     — Pipeline commercial (liste demandes, dossiers, devis)
└── /confirmation  — Page de réponse client (accepté / refusé)

API Routes
├── POST /api/chat                      — Agent IA (streamText + tools)
├── GET  /api/devis/[id]/accepter       — Mise à jour statut → accepte (lien email Brevo)
└── GET  /api/devis/[id]/refuser        — Mise à jour statut → refuse (lien email Brevo)

Services
├── src/lib/pricing/calculer-devis.ts   — Moteur de calcul déterministe
├── src/lib/pricing/helpers.ts          — Prix de base, coefficients, urgence_code
├── src/lib/services/persister-devis.ts — Sauvegarde devis + PDF + planification relance
└── src/lib/db/                         — Repositories Supabase + implémentation mémoire (tests)

Automatisations n8n (hors repo)
├── Envoi du devis par email (Brevo) après insertion en base
└── Relances automatiques (prochaine_relance : J+2 PRIORITAIRE, J+7 autres)
```

**Stack :** Next.js 15 · TypeScript · Supabase · Vercel AI SDK v6 · Claude (via Vercel AI Gateway) · HERE Routing API · Brevo · n8n · Vitest

---

## Lancement

```bash
npm install
npm run dev        # http://localhost:3000
npm run test       # 61 tests unitaires (vitest)
npm run build      # vérification TypeScript + build production
```

Pour peupler la base de données de démonstration :

```bash
npm run seed       # scripts/seed-dev.ts → insère 10 leads, 10 demandes, 8 devis
```

ou importer `scripts/seed-prod.sql` directement dans l'éditeur SQL de Supabase.

---

## Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Vercel AI Gateway (accès au modèle Claude)
AI_GATEWAY_API_KEY=<api_key>

# HERE Routing API (calcul distance + péages)
HERE_API_KEY=<api_key>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000   # ou URL Vercel en prod

# Optionnel
HITL_EMAIL=commercial@neotravel.fr         # email de notification escalade humaine
DEV_LEAD_EMAIL=test@neotravel.fr           # email par défaut formulaire (dev)
```

---

## Prompt système de l'agent

L'agent est configuré dans `src/app/api/chat/route.ts` (constante `SYSTEM`).

**Comportement général :** collecte les 6 informations de trajet (départ, arrivée, dates, aller/retour, passagers, guide), demande le type de client (particulier / entreprise / association), puis appelle le tool `calculer_devis()`.

**Outils exposés :**

| Tool | Déclencheur | Action |
|------|-------------|--------|
| `calculer_devis()` | Infos trajet + client complètes | Appel HERE → `calculeUrgenceCode()` → `calculerDevis()` → `persisterDevis()` → PDF |
| `escalade_humain()` | > 85 passagers ou ville hors France | Crée demande `cas_complexe` en base, transmet le contexte collecté |
| `enregistrer_contact()` | Email / nom / téléphone client | Met à jour le lead en base |
| `ajouter_commentaire()` | Commentaire libre du client | Mise à jour `commentaire` sur la demande |

**Garde-fous :**
- Hors-sujet → une phrase, rien d'autre
- Jamais de prix ni d'estimation avant calcul
- Jamais de référence aux outils, noms de fonctions ou données internes
- Jamais de Markdown dans les réponses

---

## Logique de tarification

Fichier : `src/lib/pricing/calculer-devis.ts`

```
Prix TTC = (prix_base × (1 + coeff_saison + coeff_capacité + coeff_délai) + suppléments) × 1.10 (TVA)
```

| Variable | Source |
|----------|--------|
| `prix_base` | Grille km (table `matrice_prix`) |
| `coeff_saisonnalite` | Mois du départ (table `matrice_prix`) |
| `coeff_capacite` | Tranche de passagers (table `matrice_prix`) |
| `coeff_delai` | `urgence_code` : PRIORITAIRE +10%, URGENT +5%, NORMAL -5%, 3MOISETPLUS -10% |
| Suppléments | Péages HERE + nuits chauffeur (120€/nuit) + guide (80€/jour) |

**`urgence_code`** calculé depuis `date_demande` → `date_depart` :
- `DD_PRIORITAIRE` : 0–7 j (+10%)
- `DD_URGENT` : 8–14 j (+5%)
- `DD_NORMAL` : 15–90 j (-5%)
- `DD_3MOISETPLUS` : > 90 j (-10%)

Les demandes < 48 h sont techniquement PRIORITAIRE ; l'escalade HITL peut être déclenchée manuellement si nécessaire.

---

## Tests

```bash
npm run test
```

**61 tests — 3 fichiers :**

- `src/__tests__/pricing/helpers.test.ts` — `getPrixBase`, `getCoeffSaisonnalite`, `getCoeffCapacite`, `getCoeffDelai`, `calculeUrgenceCode`, `calculeSupplements`, `appliquePrix`
- `src/__tests__/pricing/calculer-devis.test.ts` — happy path (5 cas), erreurs/HITL (6 cas), combinaisons de coefficients (7 cas)
- `src/__tests__/lib/supabase/client.test.ts` — fallback sans credentials

Les tests utilisent `src/lib/db/memory/` (repositories en mémoire) — aucune connexion Supabase requise.
