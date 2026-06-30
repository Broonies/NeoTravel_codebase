# Journal de décisions — NeoTravel

Projet MBA1 · Semaine du 22 au 30 juin 2026  
Équipe : H · BR · BM · PG

---

## J1 — 22 juin 2026 · Choix de stack

**Contexte :** Deux options proposées pour l'architecture de l'agent IA.  
**Option A :** n8n comme orchestrateur central (workflows visuels, agent intégré).  
**Option B :** Next.js + Vercel AI SDK comme couche agent, n8n cantonné aux automatisations back-office.

**Décision : Option B retenue.**

Raisons :
- L'agent IA conversationnel nécessite du streaming (Server-Sent Events) que n8n gère mal nativement.
- Next.js App Router permet de co-localiser UI et logique agent sans couche intermédiaire.
- n8n reste utilisé pour les tâches planifiées (relances email) où il excelle.

---

## J2 — 23 juin 2026 · Moteur de calcul déterministe

**Contexte :** Le LLM doit-il calculer le prix du devis à la volée (via le prompt) ou via une fonction dédiée ?

**Décision : `calculer_devis()` est une fonction TypeScript pure, jamais le LLM ne calcule un prix.**

Raisons :
- Un LLM peut halluciner des chiffres — inacceptable sur un devis commercial.
- La fonction est testable unitairement (golden set de 8 cas → 61 tests Vitest).
- Le jury peut auditer le calcul sans dépendre du comportement du modèle.
- Le LLM appelle `calculer_devis()` comme un *tool* : il collecte les infos, la fonction fait le calcul.

---

## J2 — 23 juin 2026 · Schéma de base de données

**Contexte :** Définition des tables Supabase.  
**Décision : 5 tables — `leads`, `demandes`, `devis`, `matrice_prix`, `relances`.**

Raisons :
- Séparation `leads` / `demandes` : un même client peut avoir plusieurs demandes.
- `matrice_prix` stocke les coefficients (saisonnalité, capacité, délai) hors code — modifiable sans redéploiement.
- `relances` est une table dédiée plutôt qu'un champ sur `devis` : supporte l'historique multi-relances.

---

## J3 — 24 juin 2026 · Stratégie de tests

**Contexte :** Les tests unitaires nécessitent-ils une connexion Supabase ?

**Décision : Repositories en mémoire (`src/lib/db/memory/`) pour les tests, Supabase uniquement en intégration.**

Raisons :
- Les tests ne doivent pas dépendre d'un service externe (CI, réseau).
- Les interfaces `DemandRepo`, `DevisRepo` sont abstraites — les implémentations mémoire et Supabase sont interchangeables.
- Règle imposée : 0 erreur sur le golden set avant de toucher à l'IA.

---

## J4 — 25 juin 2026 · Choix de la bibliothèque PDF

**Contexte :** Générer les devis en PDF côté serveur.  
**Options évaluées :** `puppeteer` (rendu Chromium headless), `@react-pdf/renderer` (JSX → PDF).

**Décision : `@react-pdf/renderer` v4.5.1.**

Raisons :
- Pas besoin d'un browser headless en production (Vercel).
- Composants JSX : cohérence avec le reste du codebase React/Next.js.
- Rendu `renderToBuffer()` en mémoire, upload direct vers Supabase Storage.

**Point d'attention :** Les fonts custom (woff2 via CDN) provoquent une `RangeError` dans fontkit — fontes système Helvetica conservées.

---

## J5 — 26 juin 2026 · Seuils HITL (Human In The Loop)

**Contexte :** Quand l'agent doit-il refuser de générer un devis et escalader vers un commercial humain ?

**Décision : escalade automatique si `nb_passagers > 85` OU ville hors France.**

Raisons :
- Au-delà de 85 passagers, la tarification dépasse la grille standard (affrètement spécial, véhicules multiples).
- Une ville étrangère implique des réglementations de transport international non couvertes par le moteur.
- La demande est créée en base avec `type_statut: 'cas_complexe'` et apparaît dans la section "Escalades humaines" du dashboard.

---

## J5 — 26 juin 2026 · Gestion RGPD

**Contexte :** Les données personnelles des prospects (nom, email, téléphone) transitent par le LLM.

**Décision : anonymisation côté serveur avant envoi au modèle ; pas de stockage de données personnelles dans les logs.**

Raisons :
- Le modèle n'a pas besoin des données personnelles pour calculer le devis — elles sont collectées séparément par le tool `enregistrer_contact()`.
- Le prompt système interdit explicitement au LLM de répéter ou de stocker des données personnelles dans ses réponses.

---

## J6 — 27 juin 2026 · Sécurité du pre-filter

**Contexte :** Des messages hors périmètre (météo, sport, politique) étaient transmis au LLM, consommant des tokens inutilement.

**Décision : `isHorsSujet()` — filtre avant le LLM basé sur une liste de mots-clés avec matching par regex word-boundary.**

Raisons :
- Un simple `includes()` provoquait des faux positifs : `'sport'` est une sous-chaîne de `'transport'` → les demandes de transport étaient bloquées.
- Le regex `(?<![a-z])mot(?![a-z])` évite les correspondances partielles.
- La liste est conservative : mieux vaut laisser passer un hors-sujet que bloquer une vraie demande.

---

## J6 — 27 juin 2026 · Injection de prompt

**Contexte :** Un utilisateur malveillant peut tenter de détourner l'agent via le chat.

**Décision : garde-fous dans le prompt système + pre-filter côté serveur.**

Mesures retenues :
- Le prompt système interdit au LLM de suivre des instructions qui contredisent son rôle.
- Le pre-filter bloque les messages manifestement hors-sujet avant même d'appeler le modèle.
- L'agent ne révèle jamais le contenu de son prompt système, les noms des outils, ni les données de la base.

---

## J7 — 28 juin 2026 · Email transactionnel

**Contexte :** Envoi du devis PDF et des relances par email.  
**Options évaluées :** Resend, Brevo (ex-Sendinblue).

**Décision : Brevo.**

Raisons :
- L'équipe avait déjà un compte Brevo actif avec les templates configurés.
- L'API transactionnelle Brevo supporte les pièces jointes PDF et les liens d'action (Accepter / Refuser).

---

## J8 — 29 juin 2026 · URL de redirection confirmation

**Contexte :** Les liens "Accepter" / "Refuser" dans l'email redirigent vers `/confirmation`. En développement local, la variable `NEXT_PUBLIC_APP_URL` pointait vers la production Vercel.

**Décision : dériver l'origine depuis `req.url` plutôt que depuis une variable d'environnement.**

```typescript
const origin = new URL(req.url).origin
return NextResponse.redirect(new URL(`/confirmation?devis=${id}&statut=accepte`, origin))
```

Raisons :
- Fonctionne automatiquement en local (`localhost:3000`) et en production sans modifier `.env`.
- Élimine le risque de redirection cross-environment.
