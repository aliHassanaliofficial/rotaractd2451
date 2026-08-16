'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbTrailProps {
  items: BreadcrumbItem[]
  className?: string
}

export function BreadcrumbTrail({ items, className }: BreadcrumbTrailProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('mb-6', className)}>
      <ol className="flex items-center gap-1.5 text-sm text-gray-500">
        <li>
          <Link href="/" className="flex items-center gap-1 transition-colors hover:text-navy">
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">Home</span>
          </Link>
        </li>

        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-navy"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-navy" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
