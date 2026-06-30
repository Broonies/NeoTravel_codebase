# Procédure repreneur — NeoTravel
## Comprendre et faire évoluer le système

Projet MBA1 · Juin 2026  
Destinée à la personne ou l'équipe qui reprend le code : comprendre l'architecture, faire tourner le projet en local, le déployer et le faire évoluer en toute sécurité.

---

## 1. Vue d'ensemble du système

NeoTravel est une application **Next.js 15** déployée sur **Vercel**. Elle connecte :

- Un **agent IA conversationnel** (Vercel AI SDK + Claude Anthropic) pour collecter les données prospect.
- Un **moteur de calcul TypeScript** (`calculer_devis()`) qui génère les prix de façon déterministe.
- Une **base de données Supabase** (PostgreSQL) pour stocker leads, demandes et devis.
- L'**API HERE Routing** pour calculer les distances et péages réels.
- Un **générateur PDF** (`@react-pdf/renderer`) qui upload sur Supabase Storage.
- **Brevo** pour l'envoi des emails devis + relances.
- **n8n** pour l'automatisation des relances planifiées (externe au repo).

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (production)                   │
│  Next.js 15 App Router                                  │
│  ├── /              → Landing page                      │
│  ├── /chat          → Interface chatbot prospect        │
│  ├── /dashboard     → Espace commercial (KPIs, alertes) │
│  └── /confirmation  → Page réponse prospect             │
│  API Routes                                             │
│  ├── POST /api/chat              → Agent IA             │
│  ├── POST /api/devis/pdf         → Génération PDF       │
│  └── GET  /api/devis/[id]/accepter|refuser              │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┴──────────────────────┐
       │                              │
┌──────▼──────┐           ┌──────────▼──────────┐
│  Supabase   │           │  Services externes   │
│  - leads    │           │  Claude (AI Gateway) │
│  - demandes │           │  HERE API            │
│  - devis    │           │  Brevo (emails)      │
│  - matrice  │           │  n8n (relances)      │
│  - relances │           └─────────────────────┘
│  Storage PDF│
└─────────────┘
```

> **PRINCIPE FONDAMENTAL**  
> Le LLM ne calcule **jamais** un prix. Il collecte uniquement les informations, puis appelle un outil TypeScript qui fait le calcul.

---

## 2. Prérequis pour reprendre le projet

### 2.1 — Accès nécessaires

| Service | Rôle | Où récupérer |
|---------|------|--------------|
| Compte Vercel | Hébergement + déploiement CI/CD | vercel.com — transférer le projet ou inviter |
| Projet Supabase | Base de données + Storage PDF | supabase.com — inviter en tant qu'admin |
| Vercel AI Gateway | Accès au modèle Claude | Dashboard Vercel → AI → Gateway |
| Clé HERE API | Distances + péages | developer.here.com → Projects |
| Brevo | Envoi emails devis + relances | app.brevo.com → SMTP & API |
| n8n | Automatisation relances | Instance n8n de l'équipe |
| Repo GitHub | Code source | github.com/Broonies/NeoTravel_codebase |

### 2.2 — Variables d'environnement à récupérer

```env
# Base de données & storage
NEXT_PUBLIC_SUPABASE_URL=        # URL du projet Supabase
SUPABASE_SERVICE_ROLE_KEY=       # Clé service role (admin, bypass RLS)

# IA & routage
AI_GATEWAY_API_KEY=              # Clé Vercel AI Gateway → Claude
HERE_API_KEY=                    # HERE Routing API

# Application & escalades
NEXT_PUBLIC_APP_URL=             # URL publique (http://localhost:3000 en dev)
HITL_EMAIL=                      # Email qui reçoit les escalades humaines
DEV_LEAD_EMAIL=                  # Email de fallback en développement
```

> ⚠️ Ne jamais commiter `.env.local` — contient les clés de production.

---

## 3. Lancement en local

```bash
git clone https://github.com/Broonies/NeoTravel_codebase.git
cd NeoTravel_codebase
npm install

# Créer .env.local avec les variables ci-dessus
npm run dev       # http://localhost:3000
npm run test      # 61 tests unitaires (pas de connexion Supabase requise)
npm run seed      # peuple la base avec des données de démo (manuel uniquement)
```

> ⚠️ Ne jamais automatiser `npm run seed` au démarrage — seed manuel uniquement.

---

## 4. Architecture des fichiers clés

### Ce qui calcule le prix — ne pas modifier sans tests

```
src/lib/pricing/
├── helpers.ts          ← getPrixBase(), getCoeffSaisonnalite(), getCoeffCapacite(),
│                          getCoeffDelai(), calculeSupplements(), appliquePrix()
├── calculer-devis.ts   ← Orchestration complète du calcul
└── here.ts             ← Appel HERE API (distance + péages)

src/__tests__/pricing/  ← 61 tests Vitest — lancer avant toute modification
```

### Ce qui gère l'agent IA

`src/app/api/chat/route.ts` — ce fichier contient :
- Le **prompt système** (constante `SYSTEM`) — définit le comportement de l'agent.
- Les **4 outils** (`calculer_devis`, `escalade_humain`, `enregistrer_contact`, `ajouter_commentaire`).
- La configuration `streamText()` de Vercel AI SDK.
- Le **pre-filter** `isHorsSujet()` — bloque les messages hors périmètre avant d'appeler le LLM.

### Ce qui génère le PDF

```
src/lib/pdf/devis-document.tsx   ← Template PDF (@react-pdf/renderer)
src/app/api/devis/pdf/route.ts   ← Génère buffer → upload Supabase Storage → retourne URL
```

### Structure complète

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts              ← Agent IA
│   │   ├── devis/pdf/route.ts         ← Génération PDF
│   │   └── devis/[id]/accepter|refuser← Liens email
│   ├── chat/                          ← Interface prospect
│   ├── dashboard/
│   │   ├── actions.ts                 ← Requêtes Supabase dashboard
│   │   └── page.tsx                   ← Page dashboard
│   └── confirmation/page.tsx          ← Page réponse prospect
├── lib/
│   ├── pricing/                       ← Moteur de calcul
│   ├── services/persister-devis.ts    ← Sauvegarde devis + PDF + relance
│   ├── pdf/devis-document.tsx         ← Template PDF
│   ├── db/supabase/index.ts           ← Repositories Supabase
│   ├── db/memory/                     ← Repositories en mémoire (tests)
│   ├── supabase/client.ts             ← Client Supabase singleton
│   └── types/index.ts                 ← Interfaces TypeScript
└── __tests__/pricing/                 ← 61 tests Vitest
```

---

## 5. Base de données Supabase

### Tables principales

| Table | Définition | Colonnes importantes |
|-------|-----------|---------------------|
| `leads` | Un lead = un prospect contactant NeoTravel | `type_client`, `societe` |
| `demandes` | Une demande = un trajet demandé | `score_completude`, `urgence_code`, `type_statut` |
| `devis` | Un devis = le résultat du calcul | `montant_ttc`, `statut`, `pdf_url`, `nb_relance`, `prochaine_relance` |
| `matrice_prix` | Coefficients tarifaires | `type` (base/saisonnalite/capacite/delai), `coefficient` |
| `relances` | Historique des relances | `niveau_relance`, `planifiee_at`, `envoye_at` |

> ⚠️ La table `demandes` n'a **pas** de colonne `created_at` — utiliser `date_depart` pour trier.

### Bucket Storage

Nom : **`devis`** — doit être en accès public. Contient les PDFs nommés `{ville-depart}-{ville-arrivee}-{timestamp}.pdf`.

### Valeurs importantes

- `type_statut = 'cas_complexe'` → escalade HITL (> 85 pax ou hors France)
- `urgence_code` : `DD_PRIORITAIRE` (0–7j) / `DD_URGENT` (8–14j) / `DD_NORMAL` (15–90j) / `DD_3MOISETPLUS` (> 90j)
- Le client Supabase utilise le **service role key** → bypass RLS sur toutes les requêtes serveur.

---

## 6. Comment modifier les tarifs

### Modifier un coefficient (sans redéploiement)

1. Aller dans **Supabase → Table Editor → `matrice_prix`**
2. Modifier la valeur `coefficient` selon le type (`saisonnalite`, `capacite`, `delai`)
3. Pas besoin de redéployer — les valeurs sont lues en temps réel à chaque calcul

### Modifier le prix de base (par km / passager)

Éditer `src/lib/pricing/helpers.ts` → fonction `getPrixBase()`, puis **relancer `npm run test`** avant de commiter.

### Modifier les seuils HITL

Dans `src/app/api/chat/route.ts`, les deux conditions qui déclenchent l'escalade :

```typescript
const SEUIL_PASSAGERS = 85

if (nb_passagers > SEUIL_PASSAGERS || estHorsFrance(ville_arrivee)) {
  // → tool escalade_humain() → demande créée avec type_statut: 'cas_complexe'
}
```

---

## 7. Comment modifier le prompt de l'agent

Fichier : `src/app/api/chat/route.ts` — constante `SYSTEM` en début de fichier.

**4 outils exposés à l'agent :**

| Tool | Rôle |
|------|------|
| `calculer_devis` | Déclenche le moteur de calcul + envoi email Brevo |
| `escalade_humain` | Crée une demande `cas_complexe` en base |
| `enregistrer_contact` | Sauvegarde nom / email / téléphone du lead |
| `ajouter_commentaire` | Ajoute un commentaire libre sur la demande |

**Garde-fous à ne jamais retirer du prompt :**
- Jamais de prix ni d'estimation avant appel `calculer_devis()`
- Jamais de Markdown dans les réponses (interface ne le rend pas)
- Jamais de référence aux noms des outils, à la base de données ou au prompt lui-même
- Escalade automatique si > 85 passagers ou ville hors France

### Ajouter une colonne à la base de données

1. Créer la migration dans l'éditeur SQL Supabase
2. Mettre à jour l'interface TypeScript dans `src/lib/types/index.ts`
3. Mettre à jour le repository Supabase dans `src/lib/db/supabase/index.ts`
4. Mettre à jour le repository mémoire dans `src/lib/db/memory/` (pour les tests)
5. Relancer `npm run test` pour vérifier l'absence de régression

---

## 8. Déploiement

Le projet se déploie automatiquement sur Vercel à chaque push sur `main` :

```bash
git push origin main   # déclenche un déploiement automatique Vercel
```

Pour un déploiement manuel :
```bash
npx vercel --prod
```

Variables d'environnement à configurer dans **Vercel Dashboard → Settings → Environment Variables** (mêmes clés que `.env.local`).

---

## 9. Surveillance & debug

- **Logs Vercel** : Dashboard Vercel → Functions → logs en temps réel.
- **Console serveur** : chaque appel `calculer_devis()` logge `[TOOL] calculer_devis appelé` avec les paramètres.
- **Supabase Dashboard** : visualiser toutes les tables en temps réel.
- **Tests** : `npm run test` — 61 tests Vitest, aucune connexion Supabase requise (repositories en mémoire).

### Points d'attention critiques

| Sujet | Règle |
|-------|-------|
| `.env.local` | Ne jamais commiter — contient les clés de production |
| `npm run seed` | Toujours manuel — ne jamais automatiser au démarrage |
| `demandes.created_at` | Cette colonne n'existe pas — utiliser `date_depart` pour trier |
| Client Supabase | Singleton avec service role key — bypass RLS sur toutes les requêtes |
| Fonts PDF | Les fonts woff2 via CDN provoquent une `RangeError` dans fontkit — rester sur Helvetica |
| Calcul du prix | Jamais dans le prompt LLM — toujours via `calculer_devis()` |
