export default function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 opacity-50 space-y-3">
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <p className="text-sm font-medium animate-pulse">{text}</p>
    </div>
  )
}