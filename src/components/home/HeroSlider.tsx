'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface Slide {
  image: string
  title: string
  subtitle?: string
  ctaPrimary?: { label: string; href: string }
  ctaSecondary?: { label: string; href: string }
}

const defaultSlides: Slide[] = [
  {
    image: '/images/hero-1.jpg',
    title: 'Empowering Communities Across Egypt',
    subtitle: 'Join 3,000+ Rotaractors making a difference',
    ctaPrimary: { label: 'Explore Clubs', href: '/clubs' },
    ctaSecondary: { label: 'Upcoming Events', href: '/events' },
  },
  {
    image: '/images/hero-2.jpg',
    title: 'Develop Leadership & Professional Skills',
    subtitle: 'Connect with passionate young leaders from 45+ clubs nationwide',
    ctaPrimary: { label: 'Join Us', href: '/about' },
    ctaSecondary: { label: 'View Gallery', href: '/gallery' },
  },
  {
    image: '/images/hero-3.jpg',
    title: 'Service Above Self',
    subtitle: 'Together we create lasting change through impactful projects',
    ctaPrimary: { label: 'Our Impact', href: '/about/impact' },
    ctaSecondary: { label: 'Contact Us', href: '/contact' },
  },
]

interface HeroSliderProps {
  slides?: Slide[]
  autoPlayInterval?: number
}

export function HeroSlider({ slides = defaultSlides, autoPlayInterval = 5000 }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length])
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(next, autoPlayInterval)
    return () => clearInterval(timer)
  }, [isPaused, next, autoPlayInterval])

  return (
    <section
      className="relative h-[60vh] min-h-[500px] w-full overflow-hidden md:h-[80vh]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${slides[current].image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/80 via-navy/60 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex h-full items-center">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${current}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl"
            >
              <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                {slides[current].title}
              </h1>
              {slides[current].subtitle && (
                <p className="mt-4 text-lg text-gray-200 sm:text-xl">{slides[current].subtitle}</p>
              )}
              <div className="mt-8 flex flex-wrap gap-4">
                {slides[current].ctaPrimary && (
                  <Button asChild variant="secondary" size="lg">
                    <a href={slides[current].ctaPrimary.href}>{slides[current].ctaPrimary.label}</a>
                  </Button>
                )}
                {slides[current].ctaSecondary && (
                  <Button asChild variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/20">
                    <a href={slides[current].ctaSecondary.href}>{slides[current].ctaSecondary.label}</a>
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <button
        onClick={prev}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white transition hover:bg-black/50"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white transition hover:bg-black/50"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              'h-2 rounded-full transition-all',
              i === current ? 'w-8 bg-gold' : 'w-2 bg-white/50 hover:bg-white/80'
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
