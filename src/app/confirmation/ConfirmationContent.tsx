'use client'
import { useSearchParams } from 'next/navigation'

export default function ConfirmationContent() {
  const params = useSearchParams()
  const statut = params.get('statut')

  const accepte = statut === 'accepte'

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 p-8">
        <div className="text-6xl">{accepte ? '✅' : '❌'}</div>
        <h1 className="text-2xl font-semibold text-gray-800">
          {accepte ? 'Devis accepté' : 'Devis refusé'}
        </h1>
        <p className="text-gray-500">
          {accepte
            ? 'Merci ! Notre équipe va prendre contact avec vous pour finaliser votre réservation.'
            : 'Votre réponse a bien été enregistrée. N\'hésitez pas à nous contacter si vous souhaitez modifier votre demande.'}
        </p>
      </div>
    </main>
  )
}
