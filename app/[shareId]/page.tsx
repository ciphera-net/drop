import { notFound } from 'next/navigation'
import DownloadPageComponent from '@/components/DownloadPage'
import { getFileMetadata } from '@/lib/api/metadata'
import { ApiError } from '@/lib/api/client'

interface DownloadPageProps {
  params: Promise<{
    shareId: string
  }>
}

export default async function DownloadPage({ params }: DownloadPageProps) {
  const { shareId } = await params

  // * Server-side check: Does this file exist?
  try {
    // We fetch metadata here just to verify existence.
    // We can pass this data to the client component to avoid double-fetching!
    const metadata = await getFileMetadata(shareId)
    
    // If we get here, the file exists. Render the client component.
    // We pass the metadata down so the client doesn't need to fetch it again.
    return (
      <main className="min-h-screen flex items-center justify-center p-4 py-12 relative overflow-hidden bg-neutral-50/50">
        <div className="relative z-10 w-full max-w-2xl">
          <DownloadPageComponent 
            shareId={shareId} 
            initialMetadata={metadata} 
          />
        </div>
      </main>
    )
  } catch (err) {
    // * If 404, show the Not Found page immediately
    if (err instanceof ApiError && err.status === 404) {
      notFound()
    }
    
    // For other errors (500, network), we can let the global error boundary handle it
    // or show a specific error state.
    throw err
  }
}
