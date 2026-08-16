'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Slide {
  title: string
  subtitle: string
  cta: { label: string; href: string }
  image: string
  bgClass: string
  mediaType?: 'image' | 'video'
  videoUrl?: string
  posterUrl?: string
}

interface HeroSliderProps {
  slides: Slide[]
  interval?: number
}

export function HeroSlider({ slides, interval = 6000 }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(0)

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1)
      setCurrent(index)
    },
    [current]
  )

  const next = useCallback(() => {
    setDirection(1)
    setCurrent((c) => (c + 1) % slides.length)
  }, [slides.length])

  const prev = useCallback(() => {
    setDirection(-1)
    setCurrent((c) => (c - 1 + slides.length) % slides.length)
  }, [slides.length])

  useEffect(() => {
    const timer = setInterval(next, interval)
    return () => clearInterval(timer)
  }, [next, interval])

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  }

  return (
    <div className="relative h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0"
        >
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-r',
              slides[current].bgClass
            )}
          />
          {slides[current].mediaType === 'video' && slides[current].videoUrl ? (
            <video
              key={slides[current].videoUrl}
              className="absolute inset-0 h-full w-full object-cover"
              src={slides[current].videoUrl}
              poster={slides[current].posterUrl || slides[current].image || undefined}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${slides[current].image})` }}
            />
          )}
          <div className="relative z-10 flex h-full items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl">
                <motion.h1
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mb-4 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl"
                >
                  {slides[current].title}
                </motion.h1>
                <motion.p
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="mb-8 text-lg text-white/80 md:text-xl"
                >
                  {slides[current].subtitle}
                </motion.p>
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  <Button
                    variant="secondary"
                    size="lg"
                    className="text-base"
                    asChild
                  >
                    <Link href={slides[current].cta.href}>
                      {slides[current].cta.label}
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={prev}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              'h-2 rounded-full transition-all',
              i === current ? 'w-8 bg-gold' : 'w-2 bg-white/50 hover:bg-white/80'
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
