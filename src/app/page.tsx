import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">N</div>
          <h1 className="text-2xl font-bold text-gray-900">NeoTravel</h1>
          <p className="text-sm text-gray-500 mt-1">Réservation d&apos;autocars · Devis instantané</p>
        </div>

        <div className="grid gap-4">
          <Link
            href="/chat"
            className="block bg-black text-white rounded-xl px-6 py-4 hover:bg-gray-800 transition-colors"
          >
            <div className="font-semibold">Assistant IA</div>
            <div className="text-sm text-gray-300 mt-0.5">Décrivez votre trajet, je calcule le devis</div>
          </Link>

          <Link
            href="/devis"
            className="block bg-white border text-gray-800 rounded-xl px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="font-semibold">Formulaire de devis</div>
            <div className="text-sm text-gray-500 mt-0.5">Saisie manuelle · calcul déterministe</div>
          </Link>

          <Link
            href="/dashboard"
            className="block bg-white border border-dashed text-gray-500 rounded-xl px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="font-semibold text-gray-700">Dashboard Sales</div>
            <div className="text-sm text-gray-400 mt-0.5">Dossiers urgents · vue commerciale</div>
          </Link>
        </div>
      </div>
    </main>
  )
}
