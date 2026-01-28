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
      <main className="min-h-screen flex items-center justify-center p-4 py-12 relative overflow-hidden bg-ciphera-gradient dark:bg-ciphera-gradient-dark">
        {/* * Background gradient orbs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] bg-brand-orange/10 rounded-full blur-[128px] opacity-60" />
          <div className="absolute bottom-0 right-1/4 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] bg-neutral-500/10 dark:bg-neutral-400/10 rounded-full blur-[128px] opacity-40" />
        </div>
        <div className="relative z-10 w-full max-w-3xl">
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
