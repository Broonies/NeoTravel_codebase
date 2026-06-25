// HERE Routing API v8 — distance + coût péages (autocar classe 4) en un seul appel

type HerePosition = { lat: number; lng: number }
type HereGeoResponse = { items: Array<{ position: HerePosition }> }
type HereFarePrice = { type: string; currency: string; value: number }
type HereFare = { price: HereFarePrice; reason: string }
type HereToll = { tollSystem: string; countryCode: string; fares?: HereFare[] }
type HereSection = { summary: { length: number }; tolls?: HereToll[] }
type HereRouteResponse = { routes: Array<{ sections: HereSection[] }> }

async function geocodeCity(city: string, apiKey: string): Promise<HerePosition | null> {
  const url =
    `https://geocode.search.hereapi.com/v1/geocode` +
    `?q=${encodeURIComponent(city + ',France')}&limit=1&apikey=${apiKey}`

  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as HereGeoResponse
  return data.items?.[0]?.position ?? null
}

export interface RouteInfo {
  km: number
  peages: number // montant total des péages en euros (classe 4, autocar ~18t)
}

export async function getRouteInfo(
  villeDepart: string,
  villeArrivee: string,
): Promise<{ ok: true; data: RouteInfo } | { ok: false; error: string }> {
  const apiKey = process.env.HERE_API_KEY
  if (!apiKey) return { ok: false, error: 'HERE_API_KEY_MISSING' }

  const [posDepart, posArrivee] = await Promise.all([
    geocodeCity(villeDepart, apiKey),
    geocodeCity(villeArrivee, apiKey),
  ])

  if (!posDepart) return { ok: false, error: `Ville introuvable : ${villeDepart}` }
  if (!posArrivee) return { ok: false, error: `Ville introuvable : ${villeArrivee}` }

  const params = new URLSearchParams({
    transportMode: 'truck',
    origin: `${posDepart.lat},${posDepart.lng}`,
    destination: `${posArrivee.lat},${posArrivee.lng}`,
    return: 'summary,tolls',
    apikey: apiKey,
  })
  params.append('vehicle[grossWeight]', '18000')

  const res = await fetch(`https://router.hereapi.com/v8/routes?${params}`)
  if (!res.ok) {
    const body = await res.text()
    console.error(`   ❌ HERE Routing ${res.status} :`, body)
    return { ok: false, error: `HERE Routing error ${res.status}` }
  }

  const data = (await res.json()) as HereRouteResponse
  const sections = data.routes?.[0]?.sections
  if (!sections?.length) return { ok: false, error: 'Aucun itinéraire trouvé' }

  const km = Math.round(
    sections.reduce((sum, s) => sum + s.summary.length, 0) / 1000,
  )

  let totalPeages = 0
  for (const section of sections) {
    for (const toll of section.tolls ?? []) {
      for (const fare of toll.fares ?? []) {
        if (fare.reason === 'toll' && fare.price?.currency === 'EUR') {
          console.log(`   Péage ${toll.tollSystem} : ${fare.price.value} €`)
          totalPeages += fare.price.value
        }
      }
    }
  }
  const peages = Math.round(totalPeages * 100) / 100

  return { ok: true, data: { km, peages } }
}
