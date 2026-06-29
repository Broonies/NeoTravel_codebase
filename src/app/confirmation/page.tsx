import { Suspense } from 'react'
import ConfirmationContent from './ConfirmationContent'

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  )
}
