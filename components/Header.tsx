import Link from 'next/link'
import UserMenu from './UserMenu'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-6 border-b border-transparent bg-white/0 backdrop-blur-sm transition-all duration-300">
      <div className="flex items-center gap-2">
        <Link href="/" className="text-lg font-bold">
          Drop
        </Link>
      </div>
      <UserMenu />
    </header>
  )
}
