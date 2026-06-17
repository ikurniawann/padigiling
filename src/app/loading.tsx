export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand mx-auto mb-4" />
        <p className="text-sm text-stone-500">Loading...</p>
      </div>
    </div>
  )
}
