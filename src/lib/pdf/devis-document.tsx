import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

export type DevisPdfData = {
  trajet:       { ville_depart: string; ville_arrivee: string; km: number }
  passagers:    number
  dates:        { depart: string; arrivee: string; nb_nuits: number }
  prix:         { base: number; montant_ht: number; montant_tva: number; montant_ttc: number }
  coefficients: { saisonnalite: number; capacite: number; delai: number }
  supplements:  { peages: number; nuit_chauffeur: number; guide: number }
  mode:         string
}

const S = StyleSheet.create({
  page:         { fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a', backgroundColor: '#ffffff' },
  // Header
  header:       { backgroundColor: '#000000', padding: '24 32', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle:  { color: '#ffffff', fontSize: 18, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  headerSub:    { color: '#aaaaaa', fontSize: 8, marginTop: 3 },
  headerDate:   { color: '#888888', fontSize: 8, textAlign: 'right' },
  // Sections
  body:         { padding: '28 32' },
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#888888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, borderBottom: '1 solid #eeeeee', paddingBottom: 4 },
  // Trajet
  trajetRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  trajetCity:   { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#000000' },
  trajetArrow:  { fontSize: 12, color: '#888888', marginHorizontal: 4 },
  trajetInfo:   { color: '#555555', fontSize: 9, marginBottom: 3 },
  // Prix
  row:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottom: '1 solid #f5f5f5' },
  rowLabel:     { color: '#444444' },
  rowValue:     { fontFamily: 'Helvetica-Bold', color: '#222222' },
  rowPos:       { color: '#dc2626' },
  rowNeg:       { color: '#16a34a' },
  // Total block
  totalBox:     { backgroundColor: '#000000', padding: '14 20', borderRadius: 6, marginTop: 16 },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalSub:     { color: '#aaaaaa', fontSize: 8 },
  totalSubVal:  { color: '#aaaaaa', fontSize: 8 },
  totalLabel:   { color: '#ffffff', fontSize: 13, fontFamily: 'Helvetica-Bold' },
  totalValue:   { color: '#ffffff', fontSize: 13, fontFamily: 'Helvetica-Bold' },
  // Footer
  footer:       { borderTop: '1 solid #eeeeee', padding: '14 32', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText:   { fontSize: 7, color: '#aaaaaa' },
})

function pct(v: number) {
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(0)} %`
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatEur(n: number) {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

export function DevisDocument({ data }: { data: DevisPdfData }) {
  const { trajet, passagers, dates, prix, coefficients, supplements, mode } = data
  const today = new Date().toLocaleDateString('fr-FR')
  const allerRetour = dates.nb_nuits > 0 || dates.depart !== dates.arrivee
  const hasSupp = supplements.peages + supplements.nuit_chauffeur + supplements.guide > 0

  return (
    <Document title={`Devis NeoTravel — ${trajet.ville_depart} → ${trajet.ville_arrivee}`}>
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <View>
            <Text style={S.headerTitle}>NEOTRAVEL</Text>
            <Text style={S.headerSub}>Location d&apos;autocars · Devis automatique</Text>
          </View>
          <View>
            <Text style={S.headerDate}>Établi le {today}</Text>
            <Text style={[S.headerDate, { marginTop: 2 }]}>Mode : {mode}</Text>
          </View>
        </View>

        <View style={S.body}>

          {/* Trajet */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Votre trajet</Text>
            <View style={S.trajetRow}>
              <Text style={S.trajetCity}>{trajet.ville_depart}</Text>
              <Text style={S.trajetArrow}>→</Text>
              <Text style={S.trajetCity}>{trajet.ville_arrivee}</Text>
            </View>
            <Text style={S.trajetInfo}>
              {formatDate(dates.depart)}
              {allerRetour ? `  →  ${formatDate(dates.arrivee)}` : ''}
              {dates.nb_nuits > 0 ? `  ·  ${dates.nb_nuits} nuit${dates.nb_nuits > 1 ? 's' : ''}` : ''}
            </Text>
            <Text style={S.trajetInfo}>
              {passagers} passager{passagers > 1 ? 's' : ''}
              {allerRetour ? '  ·  Aller / retour' : '  ·  Aller simple'}
              {'  ·  ' + trajet.km + ' km'}
            </Text>
          </View>

          {/* Décomposition */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Décomposition du prix</Text>

            <View style={S.row}>
              <Text style={S.rowLabel}>Prix de base</Text>
              <Text style={S.rowValue}>{formatEur(prix.base)}</Text>
            </View>

            {coefficients.saisonnalite !== 0 && (
              <View style={S.row}>
                <Text style={S.rowLabel}>Saisonnalité</Text>
                <Text style={coefficients.saisonnalite > 0 ? S.rowPos : S.rowNeg}>
                  {pct(coefficients.saisonnalite)}
                </Text>
              </View>
            )}

            {coefficients.capacite !== 0 && (
              <View style={S.row}>
                <Text style={S.rowLabel}>Capacité véhicule</Text>
                <Text style={coefficients.capacite > 0 ? S.rowPos : S.rowNeg}>
                  {pct(coefficients.capacite)}
                </Text>
              </View>
            )}

            {coefficients.delai !== 0 && (
              <View style={S.row}>
                <Text style={S.rowLabel}>Délai de réservation</Text>
                <Text style={coefficients.delai > 0 ? S.rowPos : S.rowNeg}>
                  {pct(coefficients.delai)}
                </Text>
              </View>
            )}

            {hasSupp && (
              <>
                {supplements.peages > 0 && (
                  <View style={S.row}>
                    <Text style={S.rowLabel}>Péages autoroute</Text>
                    <Text style={S.rowPos}>+{formatEur(supplements.peages)}</Text>
                  </View>
                )}
                {supplements.nuit_chauffeur > 0 && (
                  <View style={S.row}>
                    <Text style={S.rowLabel}>
                      Nuit chauffeur ({dates.nb_nuits} nuit{dates.nb_nuits > 1 ? 's' : ''})
                    </Text>
                    <Text style={S.rowPos}>+{formatEur(supplements.nuit_chauffeur)}</Text>
                  </View>
                )}
                {supplements.guide > 0 && (
                  <View style={S.row}>
                    <Text style={S.rowLabel}>Guide touristique</Text>
                    <Text style={S.rowPos}>+{formatEur(supplements.guide)}</Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Total */}
          <View style={S.totalBox}>
            <View style={S.totalRow}>
              <Text style={S.totalSub}>Montant HT</Text>
              <Text style={S.totalSubVal}>{formatEur(prix.montant_ht)}</Text>
            </View>
            <View style={S.totalRow}>
              <Text style={S.totalSub}>TVA (10 %)</Text>
              <Text style={S.totalSubVal}>{formatEur(prix.montant_tva)}</Text>
            </View>
            <View style={[S.totalRow, { marginBottom: 0, marginTop: 6 }]}>
              <Text style={S.totalLabel}>Total TTC</Text>
              <Text style={S.totalValue}>{formatEur(prix.montant_ttc)}</Text>
            </View>
          </View>

          {/* Mentions */}
          <View style={[S.section, { marginTop: 24, marginBottom: 0 }]}>
            <Text style={[S.footerText, { color: '#999999' }]}>
              Ce devis est établi de façon déterministe selon les tarifs en vigueur de NeoTravel.
              Il est valable 30 jours à compter de sa date d&apos;émission.
              Les prestations incluent : véhicule avec chauffeur, assurance responsabilité civile professionnelle.
              Péages et parkings à la charge du client sauf mention contraire.
            </Text>
          </View>

        </View>

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>NeoTravel · contact@neotravel.fr</Text>
          <Text style={S.footerText}>Devis généré automatiquement — {today}</Text>
        </View>

      </Page>
    </Document>
  )
}
