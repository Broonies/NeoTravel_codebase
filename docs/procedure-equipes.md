# Procédure équipes — NeoTravel
## Utiliser l'outil au quotidien

Projet MBA1 · Juin 2026

---

## À qui s'adresse ce document ?

Aux commerciaux et responsables NeoTravel qui utilisent l'outil au quotidien pour traiter les demandes de devis autocar.

---

## Vue d'ensemble du flux

```
Prospect arrive sur le site
        ↓
Chatbot collecte la demande (ville, dates, passagers…)
        ↓
      ┌─────────────────────────────────┐
      │ Demande standard (≤ 85 pax,     │  → Devis généré automatiquement
      │ villes en France)               │  → Email envoyé au prospect
      └─────────────────────────────────┘
      ┌─────────────────────────────────┐
      │ Demande complexe (> 85 pax      │  → Escalade humaine
      │ ou ville hors France)           │  → Vous intervenez manuellement
      └─────────────────────────────────┘
```

---

## 1. Le chatbot — ce que voit le prospect

L'agent conversationnel est accessible sur la page d'accueil du site. Le prospect répond à des questions simples posées par le chatbot :

1. Ville de départ et d'arrivée
2. Date de départ (et retour si aller-retour)
3. Nombre de passagers
4. Besoin d'un guide touristique ?
5. Nom, email, téléphone

Une fois toutes les informations collectées, le chatbot génère le devis et l'envoie automatiquement par email au prospect. **Vous n'avez rien à faire pour une demande standard.**

---

## 2. Le dashboard — votre espace de travail

Accès : `https://votre-domaine.vercel.app/dashboard`

### Onglet Vue d'ensemble (KPIs)

Affiche en temps réel :
- Nombre de demandes reçues
- Nombre de devis envoyés
- Taux de conversion (devis acceptés / envoyés)
- Escalades HITL en attente

### Onglet Notifications ← **à consulter chaque matin**

Deux sections :

**Escalades humaines** — demandes que l'agent ne peut pas traiter seul :
- > 85 passagers
- Ville de destination hors France

> Ces dossiers nécessitent votre intervention manuelle (voir section 3).

**Demandes incomplètes** — devis envoyés sans réponse, en attente de relance :
- Le système relance automatiquement (J+2, J+7…)
- Vous pouvez suivre l'avancement ici

### Onglet Dossiers

Liste complète de toutes les demandes avec leur statut :
- `nouvelle_demande` — en cours de traitement
- `demande_qualifiee` — devis généré et envoyé
- `demande_incomplete` — infos manquantes
- `cas_complexe` — escalade humaine requise

Cliquez sur un dossier pour voir le détail : coordonnées du prospect, trajet, devis généré, PDF téléchargeable.

---

## 3. Traiter une escalade humaine

Quand une demande apparaît dans "Escalades humaines" :

1. **Ouvrez le dossier** depuis le dashboard (onglet Notifications → Escalades humaines)
2. **Consultez le contexte** : trajet, nombre de passagers, commentaire de l'agent
3. **Contactez le prospect** directement par email ou téléphone (coordonnées dans le dossier)
4. **Établissez un devis manuel** selon vos tarifs spéciaux (affrètement, transport international)
5. **Mettez à jour le statut** du dossier dans le dashboard

---

## 4. Suivre un devis envoyé

Après envoi du devis par email, le prospect reçoit deux boutons : **Accepter** et **Refuser**.

- S'il clique **Accepter** → le statut du devis passe à `accepte` dans votre dashboard
- S'il clique **Refuser** → le statut passe à `refuse`
- Sans réponse → le système relance automatiquement à J+2 (prioritaire) ou J+7 (standard)

Vous pouvez consulter l'état de chaque devis dans l'onglet **Dossiers**.

---

## 5. Les relances automatiques

Le système relance les prospects sans réponse automatiquement via n8n :

| Urgence | 1ère relance | 2ème relance | 3ème relance |
|---------|-------------|-------------|-------------|
| Prioritaire (départ < 7 j) | J+2 | J+3 | J+5 |
| Urgent (départ 8–14 j) | J+7 | — | — |
| Normal / Long terme | J+7 | — | — |

Les relances sont envoyées automatiquement — vous n'avez pas à les déclencher manuellement.

---

## 6. Accès et comptes

| Service | Accès |
|---------|-------|
| Application NeoTravel | `https://votre-domaine.vercel.app` |
| Dashboard | `/dashboard` (même URL) |
| Supabase (base de données) | Demander à l'équipe technique |
| Brevo (emails) | Compte partagé équipe |
| n8n (relances) | Demander à l'équipe technique |

---

## 7. Que faire en cas de problème ?

| Problème | Action |
|----------|--------|
| Le chatbot ne répond plus | Contacter l'équipe technique — vérifier les logs Vercel |
| Un devis n'a pas été envoyé | Vérifier l'onglet Dossiers + logs Brevo |
| Une escalade n'apparaît pas dans le dashboard | Actualiser la page ; si persistant, contacter l'équipe technique |
| Le prospect n'a pas reçu son email | Vérifier les spams ; renvoyer depuis Brevo si nécessaire |

---

## 8. Ce que l'agent NE fait PAS

- Il ne négocie pas les prix
- Il ne traite pas les demandes > 85 passagers (escalade automatique)
- Il ne gère pas les trajets hors France
- Il ne remplace pas le commercial pour les cas complexes
