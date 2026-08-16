import type { Metadata } from 'next'
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { SiteChrome } from '@/components/layout/SiteChrome'
import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { MembershipGate } from '@/components/member/MembershipGate'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Rotaract | Empowering Young Leaders',
    template: '%s | Rotaract',
  },
  description:
    'Bringing together young leaders across Egypt to create positive change through service, professional development, and fellowship.',
  keywords: ['Rotaract', 'Rotary', 'Egypt', 'Youth Leadership', 'Community Service'],
  openGraph: {
    title: 'Rotaract',
    description: 'Empowering young leaders across Egypt to create positive change.',
    siteName: 'Rotaract',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rotaract',
    description: 'Empowering young leaders across Egypt to create positive change.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="flex min-h-full flex-col">
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="light">
            <SiteChrome>
              <MembershipGate>{children}</MembershipGate>
            </SiteChrome>
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
