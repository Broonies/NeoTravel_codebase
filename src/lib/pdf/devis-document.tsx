import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

export type DevisPdfData = {
  trajet:       { ville_depart: string; ville_arrivee: string; km: number }
  passagers:    number
  aller_retour: boolean
  dates:        { depart: string; arrivee: string; nb_nuits: number }
  prix:         { base: number; montant_ht: number; montant_tva: number; montant_ttc: number }
  coefficients: { saisonnalite: number; capacite: number; delai: number }
  supplements:  { peages: number; nuit_chauffeur: number; guide: number }
  mode:         string
  client?:      { type_client: string; societe?: string; prenom?: string; nom?: string; email?: string; telephone?: string }
  numero?:      string
}

// ── Palette ───────────────────────────────────────────────────────────────────

const NAVY  = '#1E3A5F'
const BLUE  = '#2563A8'
const LBLUE = '#EBF4FF'
const GRAY  = '#6B7280'
const LGRAY = '#F9FAFB'
const LINE  = '#E5E7EB'
const WHITE = '#FFFFFF'
const INK   = '#111827'

// ── Styles ────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page:         { fontFamily: 'Helvetica', fontSize: 9, color: INK, backgroundColor: WHITE },

  // Header
  header:       { padding: '20 32 16 32', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `3 solid ${NAVY}` },
  headerBrand:  { flexDirection: 'column' },
  brandName:    { fontSize: 22, fontFamily: 'Helvetica-Bold', color: NAVY, letterSpacing: 0.5 },
  brandTagline: { fontSize: 8, color: BLUE, marginTop: 2 },
  headerContact:{ flexDirection: 'column', alignItems: 'flex-end' },
  contactLine:  { fontSize: 8, color: GRAY, marginBottom: 2 },

  // Devis number band
  numBand:      { backgroundColor: LBLUE, padding: '10 32', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numLabel:     { fontSize: 14, fontFamily: 'Helvetica-Bold', color: NAVY },
  numValidity:  { fontSize: 8, color: BLUE },

  // Client + date row
  metaRow:      { flexDirection: 'row', padding: '14 32', gap: 16 },
  clientBox:    { flex: 1, backgroundColor: LGRAY, border: `1 solid ${LINE}`, borderRadius: 4, padding: '10 12' },
  clientLabel:  { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GRAY, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  clientName:   { fontSize: 10, fontFamily: 'Helvetica-Bold', color: INK },
  clientSub:    { fontSize: 8, color: GRAY, marginTop: 2 },
  dateBox:      { width: 130, backgroundColor: LGRAY, border: `1 solid ${LINE}`, borderRadius: 4, padding: '10 12', alignItems: 'flex-end' },
  dateLabel:    { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GRAY, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  dateValue:    { fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY },

  // Section title bar
  sectionBar:   { backgroundColor: NAVY, padding: '7 32', marginBottom: 0 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 1.5, textTransform: 'uppercase' },

  // Section body
  sectionBody:  { padding: '0 32 16 32', backgroundColor: WHITE },

  // Voyage rows
  voyageGrid:   { flexDirection: 'row', flexWrap: 'wrap', paddingTop: 12 },
  voyageItem:   { width: '50%', marginBottom: 10 },
  voyageKey:    { fontSize: 7.5, color: GRAY, marginBottom: 2 },
  voyageVal:    { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: INK },
  trajetLine:   { paddingTop: 12, paddingBottom: 4, flexDirection: 'row', alignItems: 'center' },
  trajetCity:   { fontSize: 15, fontFamily: 'Helvetica-Bold', color: NAVY },
  trajetArrow:  { fontSize: 12, color: BLUE, marginHorizontal: 8 },
  trajetKm:     { fontSize: 8, color: GRAY, marginLeft: 6, marginTop: 4 },

  // Price detail rows
  priceRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottom: `1 solid ${LINE}` },
  priceKey:     { color: INK },
  priceSub:     { fontSize: 7.5, color: GRAY, marginTop: 1 },
  pricePos:     { fontFamily: 'Helvetica-Bold', color: '#DC2626' },
  priceNeg:     { fontFamily: 'Helvetica-Bold', color: '#16A34A' },
  priceNeutral: { color: GRAY },

  // HT subtotal
  htRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 2 },
  htLabel:      { fontSize: 8, color: GRAY },
  htValue:      { fontSize: 8, color: GRAY },

  // Big TTC box
  ttcBox:       { backgroundColor: NAVY, margin: '0 32 0 32', padding: '16 24', borderRadius: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ttcLabel:     { fontSize: 11, fontFamily: 'Helvetica-Bold', color: WHITE },
  ttcSub:       { fontSize: 7.5, color: '#93C5FD', marginTop: 3 },
  ttcValue:     { fontSize: 22, fontFamily: 'Helvetica-Bold', color: WHITE },

  // Ce devis comprend
  inclusList:   { paddingTop: 10, paddingLeft: 32, paddingRight: 32 },
  incluItem:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
  incluBullet:  { width: 12, color: BLUE, fontSize: 9 },
  incluText:    { flex: 1, color: INK },

  // Mentions
  mentionWrap:  { margin: '12 32 0 32', padding: '10 12', borderRadius: 4, backgroundColor: LGRAY, border: `1 solid ${LINE}` },
  mention:      { fontSize: 7, color: GRAY, lineHeight: 1.6 },

  // Footer
  footer:       { borderTop: `1 solid ${LINE}`, padding: '10 32', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  footerLeft:   { fontSize: 7.5, color: GRAY },
  footerRight:  { fontSize: 7.5, color: GRAY },
})

// ── Formatage ─────────────────────────────────────────────────────────────────

function eur(n: number): string {
  const [int, dec] = n.toFixed(2).split('.')
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${dec} €`
}

function pct(v: number): string {
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(0)} %`
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function saisonnaliteLabel(v: number): string {
  if (v >= 0.15)  return 'Tres haute saison'
  if (v >= 0.10)  return 'Haute saison'
  if (v > 0)      return 'Saison chargee'
  if (v <= -0.07) return 'Basse saison'
  return 'Hors saison'
}

function delaiLabel(v: number): string {
  if (v >= 0.10)  return 'Prioritaire (0-1 jour)'
  if (v >= 0.05)  return 'Urgent (2-7 jours)'
  if (v <= -0.10) return 'Anticipe (> 3 mois)'
  return 'Normal (8-90 jours)'
}

function genNumero(date: string): string {
  const clean = date.replace(/-/g, '')
  const suffix = String(Math.floor(Math.random() * 900) + 100)
  return `NT-${clean}-${suffix}`
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function DevisDocument({ data }: { data: DevisPdfData }) {
  const { trajet, passagers, aller_retour, dates, prix, coefficients, supplements, client, mode } = data
  const today     = new Date().toLocaleDateString('fr-FR')
  const numero    = data.numero ?? genNumero(new Date().toISOString().slice(0, 10))
  const nb_jours  = dates.nb_nuits + 1

  const peagesAller = aller_retour
    ? Math.round(supplements.peages / 2 * 100) / 100
    : supplements.peages

  const inclus: string[] = [
    'Vehicule avec chauffeur professionnel',
    'Assurance Responsabilite Civile professionnelle',
    'Carburant inclus pour la totalite du trajet',
  ]
  if (supplements.peages > 0)        inclus.push(`Peages autoroute (${aller_retour ? 'A/R' : 'aller simple'})`)
  if (supplements.nuit_chauffeur > 0) inclus.push(`Nuit${dates.nb_nuits > 1 ? 's' : ''} chauffeur (${dates.nb_nuits} x 120,00 €)`)
  if (supplements.guide > 0)          inclus.push(`Guide touristique (${nb_jours} jour${nb_jours > 1 ? 's' : ''} x 80,00 €)`)

  return (
    <Document title={`Devis NeoTravel - ${trajet.ville_depart} vers ${trajet.ville_arrivee}`}>
      <Page size="A4" style={S.page}>

        {/* ── En-tete ── */}
        <View style={S.header}>
          <View style={S.headerBrand}>
            <Text style={S.brandName}>NEOTRAVEL</Text>
            <Text style={S.brandTagline}>Location d'autocars avec chauffeur professionnel</Text>
          </View>
          <View style={S.headerContact}>
            <Text style={S.contactLine}>Tel : 01 23 45 67 89</Text>
            <Text style={S.contactLine}>contact@neotravel.fr</Text>
            <Text style={S.contactLine}>www.neotravel.fr</Text>
            <Text style={[S.contactLine, { marginTop: 4, color: GRAY, fontSize: 7 }]}>Generation : {mode}</Text>
          </View>
        </View>

        {/* ── Bandeau numero de devis ── */}
        <View style={S.numBand}>
          <Text style={S.numLabel}>DEVIS N° {numero}</Text>
          <Text style={S.numValidity}>Valable 30 jours a compter de la date d'emission</Text>
        </View>

        {/* ── Client + date ── */}
        <View style={S.metaRow}>
          <View style={S.clientBox}>
            <Text style={S.clientLabel}>A l'attention de</Text>
            {client ? (
              <>
                <Text style={S.clientName}>
                  {client.societe
                    ? client.societe
                    : client.prenom || client.nom
                      ? `${client.prenom ?? ''} ${client.nom ?? ''}`.trim()
                      : client.type_client.charAt(0).toUpperCase() + client.type_client.slice(1)}
                </Text>
                {(client.prenom || client.nom) && client.societe && (
                  <Text style={S.clientSub}>{`${client.prenom ?? ''} ${client.nom ?? ''}`.trim()}</Text>
                )}
                {client.telephone && <Text style={S.clientSub}>Tel : {client.telephone}</Text>}
                {client.email     && <Text style={S.clientSub}>{client.email}</Text>}
              </>
            ) : (
              <Text style={S.clientName}>Demande en ligne</Text>
            )}
          </View>
          <View style={S.dateBox}>
            <Text style={S.dateLabel}>Date</Text>
            <Text style={S.dateValue}>{today}</Text>
          </View>
        </View>

        {/* ── VOTRE VOYAGE ── */}
        <View style={{ marginTop: 16 }}>
          <View style={S.sectionBar}>
            <Text style={S.sectionTitle}>Votre voyage</Text>
          </View>
          <View style={S.sectionBody}>
            <View style={S.trajetLine}>
              <Text style={S.trajetCity}>{trajet.ville_depart}</Text>
              <Text style={S.trajetArrow}>{'→'}</Text>
              <Text style={S.trajetCity}>{trajet.ville_arrivee}</Text>
              <Text style={S.trajetKm}>{trajet.km} km{aller_retour ? ` (${trajet.km * 2} km A/R)` : ''}</Text>
            </View>
            <View style={S.voyageGrid}>
              <View style={S.voyageItem}>
                <Text style={S.voyageKey}>Type de trajet</Text>
                <Text style={S.voyageVal}>{aller_retour ? 'Aller / retour' : 'Aller simple'}</Text>
              </View>
              <View style={S.voyageItem}>
                <Text style={S.voyageKey}>Nombre de passagers</Text>
                <Text style={S.voyageVal}>{passagers} personne{passagers > 1 ? 's' : ''}</Text>
              </View>
              <View style={S.voyageItem}>
                <Text style={S.voyageKey}>Date de depart</Text>
                <Text style={S.voyageVal}>{formatDate(dates.depart)}</Text>
              </View>
              {aller_retour && (
                <View style={S.voyageItem}>
                  <Text style={S.voyageKey}>Date de retour{dates.nb_nuits > 0 ? ` (${dates.nb_nuits} nuit${dates.nb_nuits > 1 ? 's' : ''})` : ''}</Text>
                  <Text style={S.voyageVal}>{formatDate(dates.arrivee)}</Text>
                </View>
              )}
              {supplements.guide > 0 && (
                <View style={S.voyageItem}>
                  <Text style={S.voyageKey}>Guide touristique</Text>
                  <Text style={S.voyageVal}>Inclus ({nb_jours} jour{nb_jours > 1 ? 's' : ''})</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── DETAIL TARIFAIRE ── */}
        <View style={{ marginTop: 4 }}>
          <View style={S.sectionBar}>
            <Text style={S.sectionTitle}>Detail tarifaire</Text>
          </View>
          <View style={[S.sectionBody, { paddingTop: 10 }]}>

            <View style={S.priceRow}>
              <Text style={S.priceKey}>Prix de base ({trajet.km} km{aller_retour ? ' A/R' : ''})</Text>
              <Text style={S.priceNeutral}>{eur(prix.base)}</Text>
            </View>

            <View style={S.priceRow}>
              <View>
                <Text style={S.priceKey}>Saisonnalite</Text>
                <Text style={S.priceSub}>{saisonnaliteLabel(coefficients.saisonnalite)}</Text>
              </View>
              <Text style={coefficients.saisonnalite > 0 ? S.pricePos : coefficients.saisonnalite < 0 ? S.priceNeg : S.priceNeutral}>
                {pct(coefficients.saisonnalite)}
              </Text>
            </View>

            {coefficients.capacite !== 0 && (
              <View style={S.priceRow}>
                <Text style={S.priceKey}>Capacite ({passagers} passagers)</Text>
                <Text style={coefficients.capacite > 0 ? S.pricePos : S.priceNeg}>
                  {pct(coefficients.capacite)}
                </Text>
              </View>
            )}

            <View style={S.priceRow}>
              <View>
                <Text style={S.priceKey}>Delai de reservation</Text>
                <Text style={S.priceSub}>{delaiLabel(coefficients.delai)}</Text>
              </View>
              <Text style={coefficients.delai > 0 ? S.pricePos : coefficients.delai < 0 ? S.priceNeg : S.priceNeutral}>
                {pct(coefficients.delai)}
              </Text>
            </View>

            {supplements.peages > 0 && (
              <View style={S.priceRow}>
                <View>
                  <Text style={S.priceKey}>Peages autoroute{aller_retour ? ' (x 2 A/R)' : ''}</Text>
                  {aller_retour && <Text style={S.priceSub}>{eur(peagesAller)} par trajet</Text>}
                </View>
                <Text style={S.pricePos}>+{eur(supplements.peages)}</Text>
              </View>
            )}

            {supplements.nuit_chauffeur > 0 && (
              <View style={S.priceRow}>
                <Text style={S.priceKey}>Nuit{dates.nb_nuits > 1 ? 's' : ''} chauffeur ({dates.nb_nuits} x 120,00 €)</Text>
                <Text style={S.pricePos}>+{eur(supplements.nuit_chauffeur)}</Text>
              </View>
            )}

            {supplements.guide > 0 && (
              <View style={S.priceRow}>
                <Text style={S.priceKey}>Guide touristique ({nb_jours} jour{nb_jours > 1 ? 's' : ''} x 80,00 €)</Text>
                <Text style={S.pricePos}>+{eur(supplements.guide)}</Text>
              </View>
            )}

            <View style={[S.htRow, { marginTop: 6 }]}>
              <Text style={S.htLabel}>Montant HT</Text>
              <Text style={S.htValue}>{eur(prix.montant_ht)}</Text>
            </View>
            <View style={S.htRow}>
              <Text style={S.htLabel}>TVA (10 %)</Text>
              <Text style={S.htValue}>{eur(prix.montant_tva)}</Text>
            </View>

          </View>
        </View>

        {/* ── TARIF TTC ── */}
        <View style={S.ttcBox}>
          <View>
            <Text style={S.ttcLabel}>TARIF TTC</Text>
            <Text style={S.ttcSub}>Les prestations de transport routier en France{'\n'}sont soumises au taux de TVA de 10 %</Text>
          </View>
          <Text style={S.ttcValue}>{eur(prix.montant_ttc)}</Text>
        </View>

        {/* ── CE DEVIS COMPREND ── */}
        <View style={{ marginTop: 16 }}>
          <View style={S.sectionBar}>
            <Text style={S.sectionTitle}>Ce devis comprend</Text>
          </View>
          <View style={S.inclusList}>
            {inclus.map((item, i) => (
              <View key={i} style={S.incluItem}>
                <Text style={S.incluBullet}>{'•'}</Text>
                <Text style={S.incluText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Mentions legales ── */}
        <View style={S.mentionWrap}>
          <Text style={S.mention}>
            Ce devis est valable 30 jours a compter de la date d'emission. Le prix indique inclut le vehicule avec chauffeur, l'assurance RC professionnelle et le carburant.
            Les peages et parkings sont a la charge du client sauf mention contraire. Pour toute acceptation, merci de retourner ce devis signe avec la mention "Bon pour accord".
          </Text>
        </View>

        {/* ── Footer ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerLeft}>NeoTravel · contact@neotravel.fr · 01 23 45 67 89</Text>
          <Text style={S.footerRight}>Devis {numero} · {today}</Text>
        </View>

      </Page>
    </Document>
  )
}
