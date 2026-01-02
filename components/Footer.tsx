import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="w-full py-8 mt-auto border-t border-neutral-100 bg-white/50 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">
            © {new Date().getFullYear()} Ciphera Drop. All rights reserved.
          </span>
        </div>
        
        <nav className="flex items-center gap-6">
          <Link 
            href="/about" 
            className="text-sm font-medium text-neutral-600 hover:text-brand-orange transition-colors"
          >
            Why Drop
          </Link>
          <Link 
            href="/faq" 
            className="text-sm font-medium text-neutral-600 hover:text-brand-orange transition-colors"
          >
            FAQ
          </Link>
          <Link 
            href="/security" 
            className="text-sm font-medium text-neutral-600 hover:text-brand-orange transition-colors"
          >
            Security
          </Link>
        </nav>
      </div>
    </footer>
  )
}
