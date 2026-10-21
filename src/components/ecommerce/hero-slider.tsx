'use client'

import { useEffect, useState, useCallback } from 'react'
import { useStore } from '@/lib/store'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HERO_SLIDES, type HeroSlide } from '@/lib/brand'

const AUTOPLAY_MS = 5000 // 5 seconds per slide

export function HeroSlider() {
  const navigate = useStore((s) => s.navigate)
  const [slides, setSlides] = useState<HeroSlide[]>(HERO_SLIDES)
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  // Fetch dynamic slides from SiteConfig
  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((d) => {
        if (d?.heroSlides && Array.isArray(d.heroSlides) && d.heroSlides.length > 0) {
          const activeSlides = d.heroSlides.filter((s: HeroSlide) => s.active !== false)
          if (activeSlides.length > 0) {
            setSlides(activeSlides)
          }
        }
      })
      .catch(() => {})
  }, [])

  // Sync current slide index when carousel scrolls
  useEffect(() => {
    if (!api) return
    const sync = () => {
      // Use rAF to defer setState out of the effect body
      requestAnimationFrame(() => {
        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap())
      })
    }
    api.on('select', sync)
    sync()
    return () => {
      api.off('select', sync)
    }
  }, [api])

  // Autoplay
  useEffect(() => {
    if (!api) return
    const t = setInterval(() => {
      api.scrollNext()
    }, AUTOPLAY_MS)
    return () => clearInterval(t)
  }, [api])

  const goTo = useCallback(
    (idx: number) => {
      api?.scrollTo(idx)
    },
    [api]
  )

  const handleCta = (slide: HeroSlide) => {
    if (slide.ctaSearchQuery) {
      navigate({ name: 'search', query: slide.ctaSearchQuery })
    } else {
      navigate({ name: 'home' })
    }
  }

  const defaultTag = (idx: number) =>
    idx === 0
      ? '🎁 Mega Bonanza'
      : idx === 1
      ? '📱 New Arrivals'
      : idx === 2
      ? '👗 Fashion Sale'
      : idx === 3
      ? '🚚 Free Shipping'
      : '🎁 New User Offer'

  return (
    <div className="relative">
      <Carousel
        opts={{ align: 'start', loop: true }}
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {slides.map((slide, idx) => (
            <CarouselItem key={slide.id || idx} className="pl-0 basis-full">
              <div
                className={`relative bg-gradient-to-r ${slide.gradient || 'from-sky-500 to-cyan-500'} text-white rounded-xl p-6 sm:p-10 min-h-[220px] sm:min-h-[280px] flex flex-col justify-center overflow-hidden`}
              >
                {/* Optional background image overlay */}
                {slide.image && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: `url(${slide.image})` }}
                    aria-hidden
                  />
                )}

                {/* Decorative circles for visual flair */}
                <div
                  className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white opacity-10 pointer-events-none"
                  aria-hidden
                />
                <div
                  className="absolute -right-10 bottom-0 w-40 h-40 rounded-full bg-white opacity-10 pointer-events-none"
                  aria-hidden
                />

                {/* Text content */}
                <div className="relative z-10 max-w-2xl">
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-90 inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full mb-3">
                    {slide.tag || defaultTag(idx)}
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-bold mt-2 mb-3 leading-tight">
                    {slide.title}
                  </h2>
                  <p className="text-sm sm:text-base opacity-90 mb-5 max-w-lg">
                    {slide.subtitle}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleCta(slide)}
                      className="bg-white text-gray-900 hover:bg-gray-100 hover:text-gray-900 shadow-md font-semibold"
                      size="lg"
                    >
                      {slide.ctaLabel || 'Shop Now'}
                    </Button>
                  </div>
                </div>

                {/* Slide number badge */}
                <div className="absolute top-3 right-3 z-10 text-xs bg-white/20 backdrop-blur text-white px-2 py-0.5 rounded-full">
                  {idx + 1} / {slides.length}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Prev / Next arrows — desktop only */}
        <CarouselPrevious className="hidden md:flex -left-3 bg-white/80 hover:bg-white border-sky-500 text-sky-600" />
        <CarouselNext className="hidden md:flex -right-3 bg-white/80 hover:bg-white border-sky-500 text-sky-600" />
      </Carousel>

      {/* Navigation dots — visible on all screen sizes */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
        {slides.map((slide, idx) => (
          <button
            key={slide.id || idx}
            onClick={() => goTo(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all ${
              idx === current
                ? 'bg-sky-600 w-6'
                : 'bg-gray-300 hover:bg-sky-400 w-2'
            }`}
          />
        ))}
      </div>

      {/* Mobile prev/next buttons (bottom-aligned, easier to tap) */}
      <div className="flex md:hidden justify-between mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => api?.scrollPrev()}
          className="border-sky-500 text-sky-600"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-gray-500 self-center">
          {current + 1} / {count || slides.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => api?.scrollNext()}
          className="border-sky-500 text-sky-600"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
