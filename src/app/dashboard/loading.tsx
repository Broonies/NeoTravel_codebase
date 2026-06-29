function SkeletonCard() {
  return (
    <div
      className="bg-white p-5 flex flex-col gap-3 animate-pulse"
      style={{ border: '1px solid #e6e6ee', borderRadius: '22px' }}
    >
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded-full" style={{ background: '#e6e6ee' }} />
        <div className="w-9 h-9 rounded-xl" style={{ background: '#e6e6ee' }} />
      </div>
      <div className="h-7 w-20 rounded-full" style={{ background: '#e6e6ee' }} />
      <div className="h-3 w-32 rounded-full" style={{ background: '#f3f3f8' }} />
    </div>
  )
}

function SkeletonRow() {
  return (
    <div
      className="flex items-center gap-4 p-4 animate-pulse"
      style={{ border: '1px solid #e6e6ee', borderRadius: '14px', background: '#fff' }}
    >
      <div className="w-1.5 h-12 rounded-full shrink-0" style={{ background: '#e6e6ee' }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-16 rounded-full" style={{ background: '#e6e6ee' }} />
        <div className="h-4 w-40 rounded-full" style={{ background: '#f3f3f8' }} />
        <div className="h-3 w-28 rounded-full" style={{ background: '#f3f3f8' }} />
      </div>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#f8f8fc' }}>
      <header className="bg-white" style={{ borderBottom: '1px solid #e6e6ee', height: '73px' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    </div>
  )
}
