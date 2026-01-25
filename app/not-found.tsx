import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50/50 dark:bg-neutral-900/50">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Page not found
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Sorry, we couldn't find the page you're looking for. It might have been removed or the link is incorrect.
          </p>
        </div>

        <div className="pt-4">
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand-orange text-white font-medium hover:bg-brand-orange/90 transition-colors shadow-lg shadow-brand-orange/20"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
