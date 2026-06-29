import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  stepCountIs,
  tool,
  type UIMessage,
} from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { z } from 'zod'
import { differenceInCalendarDays } from 'date-fns'
import { getSupabaseRepos } from '@/lib/db/supabase'
import { getSupabaseClient } from '@/lib/supabase/client'
import { getRouteInfo } from '@/lib/pricing/here'
import { calculerDevis } from '@/lib/pricing/calculer-devis'
import { calculeUrgenceCode } from '@/lib/pricing/helpers'
import { persisterDevis } from '@/lib/services/persister-devis'

export const maxDuration = 30

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  return `${local[0]}***@${domain ?? '***'}`
}

function maskName(s: string): string {
  return s.length > 0 ? `${s[0]}***` : '***'
}

// ── Niveau 1 : System prompt structuré ───────────────────────────────────────

const SYSTEM = `Date du jour : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.

Tu es NeoTravel Assistant. Tu collectes les informations nécessaires pour établir un devis autocar, puis tu routes vers le bon traitement. Tu n'es pas un assistant général.

── ÉTAPE 1 : TRAJET ──────────────────────────────────────────────────────────
Collecte ces 6 informations. Ne suppose, ne déduis, n'invente aucune valeur.
Demande les informations manquantes explicitement, une ou deux à la fois.

  1. Ville de départ
  2. Ville d'arrivée
  3. Date de départ — format JJ/MM/AAAA, convertis en YYYY-MM-DD.
     Les dates sont TOUJOURS dans le futur. Si une date sans année est déjà passée cette année, prends l'année suivante silencieusement.
  4. Aller simple ou aller/retour ?
     → Si aller simple : ne pas demander de date de retour.
     → Si aller/retour : BLOQUANT — demande OBLIGATOIREMENT la date de retour avant de passer à la suite.
       Ne jamais appeler calculer_devis() avec aller_retour=true sans date_arrivee.
  5. Nombre de passagers
  6. Guide touristique inclus ? (défaut : non)

── ÉTAPE 2 : TYPE DE CLIENT ──────────────────────────────────────────────────
Une fois l'étape 1 complète, demande OBLIGATOIREMENT :
  "Êtes-vous une entreprise, une association ou un particulier ?"
  → Si particulier : tu as tout. Appelle calculer_devis() immédiatement.
  → Si entreprise ou association : BLOQUANT — demande OBLIGATOIREMENT le nom de la structure avant d'appeler calculer_devis().
    Exemple : "Quel est le nom de votre entreprise / association ?"
    Ne jamais appeler calculer_devis() sans le champ societe pour entreprise ou association.
  → Ne jamais supposer ni déduire. Toujours demander explicitement.

Dès que les étapes 1 et 2 sont complètes (societe incluse si applicable) → appelle calculer_devis() IMMÉDIATEMENT.
Ne résume pas. Ne demande pas de confirmation. Appelle directement.

── ESCALADE HUMAINE ──────────────────────────────────────────────────────────
Appelle escalade_humain() IMMÉDIATEMENT si :
  • Nombre de passagers > 85
  • Ville de départ ou d'arrivée hors de France

Ce sont les SEULS déclencheurs. N'escalade pas pour une autre raison.
N'annonce pas l'escalade. Appelle directement.
Après l'escalade : confirme en UNE phrase que la demande est transmise.
Si le client demande pourquoi : une phrase, raison exacte uniquement, rien d'autre.

── HORS-SUJET ────────────────────────────────────────────────────────────────
Si la demande n'est pas liée au transport en autocar, réponds UNIQUEMENT :
"Je suis spécialisé dans les devis d'autocars. Pour tout autre sujet, je ne suis pas en mesure de vous aider."

── APRÈS CALCULER_DEVIS() RÉUSSI ─────────────────────────────────────────────
RÈGLE ABSOLUE : STOP après chaque question. N'enchaîne JAMAIS deux actions dans la même réponse. Attends toujours la réponse du client avant d'appeler un outil.

  1. Confirme en une phrase que le devis est prêt (bouton de téléchargement disponible ci-dessus).
     Puis pose UNE seule question : "Pour recevoir votre devis par email, pourriez-vous me communiquer votre adresse ?"
     → STOP. Attends l'email du client.
  2. Client donne son email → appelle enregistrer_contact(). Confirme en une phrase. Ne dis jamais que tu envoies toi-même un email.
     Puis pose UNE seule question : "Souhaitez-vous laisser votre nom et numéro de téléphone pour le suivi ?"
     → STOP. Attends la réponse.
  3. Client donne nom/téléphone → appelle enregistrer_contact(). Confirme.
     Puis pose UNE seule question : "Souhaitez-vous ajouter un commentaire ou une précision ?"
     → STOP. Attends la réponse.
  4. Client donne un commentaire → appelle ajouter_commentaire(). Conclus poliment.
     Client refuse → conclus poliment directement.

── INTERDICTIONS ABSOLUES ────────────────────────────────────────────────────
• Ne cite jamais de prix, tarifs ou fourchettes
• Ne fais aucun calcul, aucune estimation
• N'improvise pas si une information est manquante — demande-la
• Ne réponds jamais hors du périmètre autocar
• Ne redirige jamais vers un commercial après un devis réussi
• Ne mentionne JAMAIS tes outils, fonctions, critères ou fonctionnement interne. Interdit : "calculer_devis", "escalade_humain", "outil", "tool", "fonction", "système", "algorithme", "function_results"
• Ne fais JAMAIS de récapitulatif avant d'appeler un outil
• N'affiche JAMAIS de JSON, de données brutes, de résultats techniques ou de balises comme <function_results>. Ces données sont internes et invisibles pour le client.
• Si le client demande où trouver le PDF ou le lien : réponds uniquement "Le bouton de téléchargement est disponible directement dans la carte de devis affichée dans notre conversation."
• Hors périmètre → UNE seule phrase polie, rien de plus

Réponds en français. Sois chaleureux, professionnel et concis.`

// ── Niveau 2 : Pre-filter hors-sujet (avant d'appeler le LLM) ────────────────

const HORS_SUJET_KEYWORDS = [
  // Sujets clairement non liés
  'météo', 'température', 'pluie', 'soleil',
  'recette', 'cuisine', 'restaurant', 'gastronomie',
  'football', 'rugby', 'tennis', 'sport', 'match', 'score',
  'politique', 'élection', 'président', 'gouvernement', 'loi', 'parlement',
  'médecine', 'docteur', 'médicament', 'santé', 'maladie', 'hôpital',
  'bitcoin', 'crypto', 'bourse', 'action', 'investissement', 'finance',
  'javascript', 'python', 'html', 'css', 'code informatique', 'programmer',
  'poème', 'blague', 'histoire drôle',
  'traduction', 'traduire',
  // Autres modes de transport (hors-périmètre)
  'avion', 'vol ', 'aéroport', 'billet d\'avion',
  'hôtel', 'hébergement', 'airbnb',
  'croisière', 'bateau',
]

const MSG_HORS_SUJET =
  "Je suis spécialisé dans les devis d'autocars. Pour tout autre sujet, je ne suis pas en mesure de vous aider."

function isHorsSujet(message: string): boolean {
  const lower = message.toLowerCase()
  return HORS_SUJET_KEYWORDS.some((kw) => lower.includes(kw))
}

function staticResponse(text: string): Response {
  const id = 'static-0'
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: 'text-start', id })
      writer.write({ type: 'text-delta', id, delta: text })
      writer.write({ type: 'text-end',   id })
    },
  })
  return createUIMessageStreamResponse({ stream })
}

// ── Route principale ──────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  // Pre-filter : dernier message utilisateur
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
  const lastText = lastUserMsg?.parts
    ?.filter((p) => p.type === 'text')
    .map((p) => p.text)
    .join(' ') ?? ''

  if (isHorsSujet(lastText)) {
    console.log(`\n🚫 [PRE-FILTER] Hors-sujet détecté : "${lastText.slice(0, 60)}"`)
    return staticResponse(MSG_HORS_SUJET)
  }

  // LLM + tools
  const result = streamText({
    model: gateway('anthropic/claude-sonnet-4'),
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(2),
    onFinish: ({ usage, steps }) => {
      const total = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)
      const estimatedCost = ((usage.inputTokens ?? 0) * 0.00025 + (usage.outputTokens ?? 0) * 0.00125) / 1000
      console.log(`📊 Tokens — input: ${usage.inputTokens} | output: ${usage.outputTokens} | total: ${total} | ~$${estimatedCost.toFixed(5)} | steps: ${steps.length}`)
    },
    tools: {

      calculer_devis: tool({
        description:
          'Calcule un devis autocar de façon 100 % déterministe. ' +
          'Appeler dès que les 7 informations trajet+type_client sont disponibles. ' +
          'Ne jamais estimer le prix — uniquement ce tool.',
        inputSchema: z.object({
          ville_depart:  z.string().describe('Ville de départ'),
          ville_arrivee: z.string().describe("Ville d'arrivée"),
          date_depart:   z.string().describe('Date de départ (YYYY-MM-DD)'),
          date_arrivee:  z.string().optional().describe('Date de retour (YYYY-MM-DD). OBLIGATOIRE si aller_retour=true. Omettre uniquement si aller_retour=false.'),
          nb_passagers:  z.number().int().min(1).describe('Nombre de passagers'),
          aller_retour:  z.boolean().describe('true = aller/retour, false = aller simple'),
          guide:         z.boolean().describe('true = guide touristique inclus'),
          type_client:   z.enum(['entreprise', 'association', 'particulier']).describe('Type de client'),
          societe:       z.string().optional().describe('Nom de la structure (si entreprise ou association)'),
        }),
        execute: async ({
          ville_depart, ville_arrivee, date_depart, date_arrivee: _dateArrivee,
          nb_passagers, aller_retour, guide,
          type_client, societe,
        }) => {
          // Garde-fou : aller/retour sans date de retour → erreur bloquante
          if (aller_retour && !_dateArrivee) {
            return { ok: false, error: 'DATE_RETOUR_MANQUANTE', reason: 'La date de retour est obligatoire pour un aller/retour.' }
          }

          // Filet de sécurité : date passée → avance d'un an silencieusement
          let safeDepart = date_depart
          const today = new Date(); today.setHours(0, 0, 0, 0)
          if (new Date(date_depart) <= today) {
            const d = new Date(date_depart)
            d.setFullYear(d.getFullYear() + 1)
            safeDepart = d.toISOString().split('T')[0]
            console.warn(`   ⚠️  Date passée corrigée : ${date_depart} → ${safeDepart}`)
          }
          const date_arrivee = _dateArrivee && new Date(_dateArrivee) > new Date(safeDepart)
            ? _dateArrivee
            : safeDepart

          console.log('\n' + '─'.repeat(52))
          console.log('🤖 [TOOL] calculer_devis appelé par le LLM')
          console.log(`   Trajet : ${ville_depart} → ${ville_arrivee}`)
          console.log(`   Dates  : ${safeDepart} → ${date_arrivee} | A/R: ${aller_retour}`)
          console.log(`   Pax    : ${nb_passagers} | Guide: ${guide}`)
          console.log(`   Client : [${type_client}${societe ? ' — ' + societe : ''}]`)

          const route = await getRouteInfo(ville_depart, ville_arrivee)
          if (!route.ok) return { ok: false, error: route.error }

          const peagesTotal = aller_retour
            ? Math.round(route.data.peages * 2 * 100) / 100
            : route.data.peages

          console.log(`   ✅ ${route.data.km} km | péages ${peagesTotal} €`)

          const urgenceCode = calculeUrgenceCode(new Date(), new Date(safeDepart))
          const repos = getSupabaseRepos()

          let lead: Awaited<ReturnType<typeof repos.leads.create>>
          let demande: Awaited<ReturnType<typeof repos.demandes.create>>
          try {
            lead = await repos.leads.create({
              prenom: '', nom: '', email: '', telephone: '', type_client,
              societe: societe || undefined,
            })
            demande = await repos.demandes.create({
              lead_id: lead.id,
              ville_depart, ville_arrivee,
              date_depart:  new Date(safeDepart),
              date_arrivee: new Date(date_arrivee),
              aller_retour, nb_passagers,
              type_trajet: 'standard',
              urgence_code: urgenceCode,
              details_json: { km_distance: route.data.km, peages: peagesTotal, guide },
              score_completude: 1.0,
              type_statut: 'demande_qualifiee',
            })
          } catch (err) {
            const msg = err instanceof Error ? err.message : JSON.stringify(err)
            console.error('❌ [TOOL] Supabase insert error:', msg)
            return { ok: false, error: 'DB_ERROR', reason: msg }
          }

          const result = await calculerDevis(demande.id, repos)
          if (!result.ok) {
            console.error(`   ❌ [${result.error}] ${result.reason}`)
            await repos.demandes.update(demande.id, { type_statut: 'demande_incomplete' }).catch(() => null)
            return { ok: false, error: result.error, reason: result.reason }
          }

          const nb_nuits = Math.max(
            0,
            differenceInCalendarDays(new Date(date_arrivee), new Date(safeDepart)),
          )
          const nb_jours = nb_nuits + 1
          const d = result.data
          const supplements = {
            peages:         peagesTotal,
            nuit_chauffeur: nb_nuits > 0 ? nb_nuits * 120 : 0,
            guide:          guide ? nb_jours * 80 : 0,
          }
          console.log(`   ✅ Devis : ${d.montant_ttc} € TTC`)

          // ── Persistance devis + PDF ──────────────────────────────────────
          let pdfUrl: string | null = null
          try {
            pdfUrl = await persisterDevis({
              demandeId:    demande.id,
              calcul:       d,
              trajet:       { ville_depart, ville_arrivee, km: route.data.km },
              dates:        { depart: safeDepart, arrivee: date_arrivee, nb_nuits },
              passagers:    nb_passagers,
              aller_retour,
              supplements,
              client:       { type_client, societe: societe || undefined },
            })
          } catch (err) {
            const msg = err instanceof Error ? err.message : JSON.stringify(err)
            console.error('   ⚠️  Persistance non-bloquante :', msg)
          }

          console.log('─'.repeat(52) + '\n')
          return {
            ok: true,
            demande_id:    demande.id,
            lead_id:       lead.id,
            trajet:        { ville_depart, ville_arrivee, km: route.data.km },
            passagers:     nb_passagers,
            aller_retour,
            dates:         { depart: safeDepart, arrivee: date_arrivee, nb_nuits },
            prix:          { base: d.prix_base, montant_ht: d.montant_ht, montant_tva: d.montant_tva, montant_ttc: d.montant_ttc },
            coefficients:  { saisonnalite: d.coeff_saisonnalite, capacite: d.coeff_capacite, delai: d.coeff_delai },
            supplements,
            mode:          d.mode_generation,
            pdf_url:       pdfUrl,
          }
        },
      }),

      enregistrer_contact: tool({
        description: 'Met à jour les coordonnées du client (lead) après génération du devis. Appeler dès que l\'email est fourni, puis à nouveau si le client donne son nom/téléphone.',
        inputSchema: z.object({
          lead_id:   z.number().describe('ID du lead retourné par calculer_devis'),
          email:     z.string().optional().describe('Email du client'),
          prenom:    z.string().optional().describe('Prénom du client'),
          nom:       z.string().optional().describe('Nom du client'),
          telephone: z.string().optional().describe('Numéro de téléphone'),
        }),
        execute: async ({ lead_id, email, prenom, nom, telephone }) => {
          const patch: Record<string, string> = {}
          if (email)     { patch.email     = email;     console.log(`\n📧 [TOOL] Contact lead #${lead_id} — email: ${maskEmail(email)}`) }
          if (prenom)    { patch.prenom    = prenom;    console.log(`   prenom: ${maskName(prenom)}`) }
          if (nom)       { patch.nom       = nom;       console.log(`   nom: ${maskName(nom)}`) }
          if (telephone) { patch.telephone = telephone; console.log(`   tel: ***`) }
          if (Object.keys(patch).length === 0) return { ok: true }
          const supabase = getSupabaseClient()
          await supabase.from('leads').update(patch).eq('id', lead_id)
          return { ok: true }
        },
      }),

      ajouter_commentaire: tool({
        description: 'Enregistre un commentaire du client sur sa demande après génération du devis.',
        inputSchema: z.object({
          demande_id:  z.number().describe('ID de la demande retourné par calculer_devis'),
          commentaire: z.string().describe('Commentaire ou précision du client'),
        }),
        execute: async ({ demande_id, commentaire }) => {
          console.log(`\n💬 [TOOL] Commentaire ajouté sur demande #${demande_id}`)
          const repos = getSupabaseRepos()
          await repos.demandes.update(demande_id, { commentaire })
          return { ok: true }
        },
      }),

      escalade_humain: tool({
        description:
          'Déclenche une escalade vers un commercial humain (HITL). ' +
          'Obligatoire si : nb_passagers > 85 OU ville de départ/arrivée hors France. ' +
          'Passe tout ce qui a été collecté jusque-là (villes, dates, passagers).',
        inputSchema: z.object({
          raison:        z.string().describe("Raison précise de l'escalade"),
          nb_passagers:  z.number().optional().describe('Nombre de passagers si connu'),
          ville_depart:  z.string().optional().describe('Ville de départ si connue'),
          ville_arrivee: z.string().optional().describe("Ville d'arrivée si connue"),
          date_depart:   z.string().optional().describe('Date de départ (YYYY-MM-DD) si connue'),
          date_arrivee:  z.string().optional().describe('Date de retour (YYYY-MM-DD) si connue'),
          aller_retour:  z.boolean().optional().describe('Type de trajet si connu'),
          nom_client:    z.string().optional(),
          email_client:  z.string().optional(),
        }),
        execute: async ({
          raison, nb_passagers, ville_depart, ville_arrivee,
          date_depart, date_arrivee, aller_retour, nom_client, email_client,
        }) => {
          console.log(`\n🚨 [HITL] escalade déclenchée (${nb_passagers ? nb_passagers + ' pax' : ville_depart ?? '?'} → ${ville_arrivee ?? '?'})`)

          const repos = getSupabaseRepos()

          const lead = await repos.leads.create({
            prenom:      nom_client?.split(' ')[0] ?? 'Inconnu',
            nom:         nom_client?.split(' ').slice(1).join(' ') ?? 'Chat',
            email:       email_client ?? 'hitl@neotravel.fr',
            telephone:   '0600000000',
            type_client: 'particulier',
          })

          const now = new Date()
          const dateD = date_depart  ? new Date(date_depart)  : now
          const dateA = date_arrivee ? new Date(date_arrivee) : dateD
          const urgenceCode = date_depart
            ? calculeUrgenceCode(now, dateD)
            : 'DD_NORMAL'

          // Score de complétude partiel
          let score = 0
          if (ville_depart)  score += 0.20
          if (ville_arrivee) score += 0.20
          if (date_depart)   score += 0.15
          if (nb_passagers)  score += 0.15
          if (aller_retour !== undefined && date_arrivee) score += 0.10
          if (email_client)  score += 0.10
          if (nom_client)    score += 0.10

          const demande = await repos.demandes.create({
            lead_id:         lead.id,
            ville_depart:    ville_depart  ?? '',
            ville_arrivee:   ville_arrivee ?? '',
            date_depart:     dateD,
            date_arrivee:    dateA,
            aller_retour:    aller_retour  ?? false,
            nb_passagers:    nb_passagers  ?? 0,
            type_trajet:     'cas_complexe',
            urgence_code:    urgenceCode,
            details_json:    {},
            score_completude: Math.round(score * 100) / 100,
            type_statut:     'cas_complexe',
            commentaire:     raison,
          })

          console.log(`   ✅ Demande HITL #${demande.id} persistée (lead #${lead.id}) — score ${Math.round(score * 100)} %`)

          return {
            ok: true,
            demande_id: demande.id,
            message:
              "Votre demande a bien été transmise à notre équipe commerciale. " +
              "Un conseiller NeoTravel vous contactera dans les meilleurs délais (généralement sous 2h en horaires ouvrés).",
          }
        },
      }),

    },
  })

  return result.toUIMessageStreamResponse()
}
