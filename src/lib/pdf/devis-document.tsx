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
}

const S = StyleSheet.create({
  page:         { fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a', backgroundColor: '#ffffff' },
  header:       { backgroundColor: '#000000', padding: '24 32', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle:  { color: '#ffffff', fontSize: 18, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  headerSub:    { color: '#aaaaaa', fontSize: 8, marginTop: 3 },
  headerDate:   { color: '#888888', fontSize: 8, textAlign: 'right' },
  body:         { padding: '28 32' },
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#888888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, borderBottom: '1 solid #eeeeee', paddingBottom: 4 },
  trajetRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  trajetCity:   { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#000000' },
  trajetArrow:  { fontSize: 12, color: '#888888', marginHorizontal: 6 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottom: '1 solid #f5f5f5' },
  rowLeft:      { width: '72%' },
  rowLabel:     { color: '#444444' },
  rowSub:       { color: '#888888', fontSize: 7.5, marginTop: 2 },
  rowValue:     { width: '28%', fontFamily: 'Helvetica-Bold', color: '#222222', textAlign: 'right' },
  rowPos:       { width: '28%', color: '#dc2626', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  rowNeg:       { width: '28%', color: '#16a34a', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  rowNeutral:   { width: '28%', color: '#888888', textAlign: 'right' },
  totalBox:     { backgroundColor: '#000000', padding: '14 20', borderRadius: 6, marginTop: 16 },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalSub:     { color: '#aaaaaa', fontSize: 8 },
  totalSubVal:  { color: '#aaaaaa', fontSize: 8, textAlign: 'right' },
  totalLabel:   { color: '#ffffff', fontSize: 13, fontFamily: 'Helvetica-Bold' },
  totalValue:   { color: '#ffffff', fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  footer:       { borderTop: '1 solid #eeeeee', padding: '14 32', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText:   { fontSize: 7, color: '#aaaaaa' },
  mention:      { fontSize: 7, color: '#999999', lineHeight: 1.6 },
})

// Formatage FR : espace pour les milliers, virgule pour les décimales
function eur(n: number): string {
  const [int, dec] = n.toFixed(2).split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${grouped},${dec} €`
}

function pct(v: number): string {
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(0)} %`
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function delaiLabel(v: number): string {
  if (v <= -0.10) return 'Anticipee (> 3 mois)'
  if (v <= -0.05) return 'Normale (1-3 mois)'
  if (v === 0)    return 'Court (2 sem. - 1 mois)'
  return 'Prioritaire (< 2 semaines)'
}

function saisonnaliteLabel(v: number): string {
  if (v >= 0.15)  return 'Haute saison'
  if (v >= 0.10)  return 'Tres haute saison'
  if (v > 0)      return 'Saison chargee'
  if (v <= -0.07) return 'Basse saison'
  return 'Hors saison'
}

export function DevisDocument({ data }: { data: DevisPdfData }) {
  const { trajet, passagers, aller_retour, dates, prix, coefficients, supplements, mode } = data
  const today = new Date().toLocaleDateString('fr-FR')

  // Pour A/R, le montant péage total = 2 × aller simple
  const peagesAllerSimple = aller_retour
    ? Math.round(supplements.peages / 2 * 100) / 100
    : supplements.peages

  const nb_jours = dates.nb_nuits + 1

  return (
    <Document title={`Devis NeoTravel - ${trajet.ville_depart} vers ${trajet.ville_arrivee}`}>
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <View>
            <Text style={S.headerTitle}>NEOTRAVEL</Text>
            <Text style={S.headerSub}>Location d'autocars - Devis automatique</Text>
          </View>
          <View>
            <Text style={S.headerDate}>Etabli le {today}</Text>
            <Text style={[S.headerDate, { marginTop: 2 }]}>Mode : {mode}</Text>
          </View>
        </View>

        <View style={S.body}>

          {/* ── Trajet ── */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Votre trajet</Text>

            <View style={S.trajetRow}>
              <Text style={S.trajetCity}>{trajet.ville_depart}</Text>
              <Text style={S.trajetArrow}>{'->'}</Text>
              <Text style={S.trajetCity}>{trajet.ville_arrivee}</Text>
            </View>

            <View style={S.row}>
              <Text style={[S.rowLabel, { width: '72%' }]}>Type de trajet</Text>
              <Text style={S.rowValue}>{aller_retour ? 'Aller / retour' : 'Aller simple'}</Text>
            </View>
            <View style={S.row}>
              <Text style={[S.rowLabel, { width: '72%' }]}>Date de depart</Text>
              <Text style={S.rowValue}>{formatDate(dates.depart)}</Text>
            </View>
            {aller_retour && (
              <View style={S.row}>
                <Text style={[S.rowLabel, { width: '72%' }]}>
                  Date de retour
                  {dates.nb_nuits > 0 ? ` (${dates.nb_nuits} nuit${dates.nb_nuits > 1 ? 's' : ''})` : ''}
                </Text>
                <Text style={S.rowValue}>{formatDate(dates.arrivee)}</Text>
              </View>
            )}
            <View style={S.row}>
              <Text style={[S.rowLabel, { width: '72%' }]}>Passagers</Text>
              <Text style={S.rowValue}>{passagers}</Text>
            </View>
            <View style={S.row}>
              <Text style={[S.rowLabel, { width: '72%' }]}>Distance</Text>
              <Text style={S.rowValue}>{trajet.km} km{aller_retour ? ` (${trajet.km * 2} km A/R)` : ''}</Text>
            </View>
          </View>

          {/* ── Décomposition du prix ── */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Decomposition du prix</Text>

            {/* Prix de base */}
            <View style={S.row}>
              <Text style={[S.rowLabel, { width: '72%' }]}>Prix de base</Text>
              <Text style={S.rowValue}>{eur(prix.base)}</Text>
            </View>

            {/* Saisonnalité — toujours affichée */}
            <View style={S.row}>
              <View style={S.rowLeft}>
                <Text style={S.rowLabel}>Saisonnalite</Text>
                <Text style={S.rowSub}>{saisonnaliteLabel(coefficients.saisonnalite)}</Text>
              </View>
              <Text style={
                coefficients.saisonnalite > 0 ? S.rowPos :
                coefficients.saisonnalite < 0 ? S.rowNeg : S.rowNeutral
              }>
                {pct(coefficients.saisonnalite)}
              </Text>
            </View>

            {/* Capacité — seulement si ≠ 0 */}
            {coefficients.capacite !== 0 && (
              <View style={S.row}>
                <Text style={[S.rowLabel, { width: '72%' }]}>Capacite vehicule ({passagers} pax)</Text>
                <Text style={coefficients.capacite > 0 ? S.rowPos : S.rowNeg}>
                  {pct(coefficients.capacite)}
                </Text>
              </View>
            )}

            {/* Délai — toujours affiché */}
            <View style={S.row}>
              <View style={S.rowLeft}>
                <Text style={S.rowLabel}>Delai de reservation</Text>
                <Text style={S.rowSub}>{delaiLabel(coefficients.delai)}</Text>
              </View>
              <Text style={
                coefficients.delai > 0 ? S.rowPos :
                coefficients.delai < 0 ? S.rowNeg : S.rowNeutral
              }>
                {pct(coefficients.delai)}
              </Text>
            </View>

            {/* ── Suppléments ── */}
            {supplements.peages > 0 && (
              <View style={S.row}>
                <View style={S.rowLeft}>
                  <Text style={S.rowLabel}>
                    Peages autoroute{aller_retour ? ' (x 2 A/R)' : ''}
                  </Text>
                  {aller_retour && (
                    <Text style={S.rowSub}>
                      {eur(peagesAllerSimple)} par trajet
                    </Text>
                  )}
                </View>
                <Text style={S.rowPos}>+{eur(supplements.peages)}</Text>
              </View>
            )}

            {supplements.nuit_chauffeur > 0 && (
              <View style={S.row}>
                <Text style={[S.rowLabel, { width: '72%' }]}>
                  Nuit chauffeur ({dates.nb_nuits} nuit{dates.nb_nuits > 1 ? 's' : ''} x 120,00 €)
                </Text>
                <Text style={S.rowPos}>+{eur(supplements.nuit_chauffeur)}</Text>
              </View>
            )}

            {supplements.guide > 0 && (
              <View style={S.row}>
                <Text style={[S.rowLabel, { width: '72%' }]}>
                  Guide touristique ({nb_jours} jour{nb_jours > 1 ? 's' : ''} x 80,00 €)
                </Text>
                <Text style={S.rowPos}>+{eur(supplements.guide)}</Text>
              </View>
            )}
          </View>

          {/* ── Total ── */}
          <View style={S.totalBox}>
            <View style={S.totalRow}>
              <Text style={S.totalSub}>Montant HT</Text>
              <Text style={S.totalSubVal}>{eur(prix.montant_ht)}</Text>
            </View>
            <View style={S.totalRow}>
              <Text style={S.totalSub}>TVA (10 %)</Text>
              <Text style={S.totalSubVal}>{eur(prix.montant_tva)}</Text>
            </View>
            <View style={[S.totalRow, { marginBottom: 0, marginTop: 8, paddingTop: 8, borderTop: '1 solid #444444' }]}>
              <Text style={S.totalLabel}>Total TTC</Text>
              <Text style={S.totalValue}>{eur(prix.montant_ttc)}</Text>
            </View>
          </View>

          {/* ── Mentions légales ── */}
          <View style={{ marginTop: 24 }}>
            <Text style={S.mention}>
              Ce devis est etabli de facon deterministe selon les tarifs en vigueur de NeoTravel.
              Il est valable 30 jours a compter de sa date d'emission.
              Les prestations incluent : vehicule avec chauffeur, assurance RC professionnelle.
              Peages et parkings a la charge du client sauf mention contraire.
            </Text>
          </View>

        </View>

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>NeoTravel · contact@neotravel.fr</Text>
          <Text style={S.footerText}>Devis genere automatiquement - {today}</Text>
        </View>

      </Page>
    </Document>
  )
}
