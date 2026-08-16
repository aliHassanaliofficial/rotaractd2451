import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-8 flex items-center justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-navy to-cranberry">
          <span className="text-4xl font-bold text-gold">R</span>
        </div>
      </div>

      <h1 className="mb-2 text-8xl font-bold text-navy">404</h1>
      <h2 className="mb-4 text-2xl font-semibold text-gray-700">Page Not Found</h2>
      <p className="mb-8 max-w-md text-gray-500">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or doesn&apos;t exist.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Button className="bg-gradient-to-r from-navy to-rotary-blue text-white hover:brightness-110" asChild>
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Site
          </Link>
        </Button>
      </div>

      <div className="mt-12">
        <p className="mb-3 text-sm text-gray-400">Try searching for what you need:</p>
        <form action="/search" method="GET" className="flex gap-2">
          <Input
            name="q"
            placeholder="Search events, clubs, news..."
            className="w-64"
          />
          <Button type="submit" variant="secondary" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
