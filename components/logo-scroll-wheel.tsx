"use client"
/* eslint-disable @next/next/no-img-element */

import { useMemo } from 'react'

interface LogoScrollWheelProps {
  logos: Array<{ src: string; alt: string; href?: string }>
}

export function LogoScrollWheel({ logos }: LogoScrollWheelProps) {
  const marqueeItems = useMemo(() => {
    if (!logos || logos.length === 0) return []
    // Duplicate array so the animation can loop seamlessly.
    return [...logos, ...logos]
  }, [logos])

  return (
    <div className="overflow-hidden py-8">
      <div
        className="flex gap-8"
        style={{
          width: 'max-content',
          animation: 'carma-marquee 25s linear infinite',
        }}
      >
        {marqueeItems.map((logo, index) => (
          <div
            key={`${logo.src}-${index}`}
            className="flex-shrink-0 flex items-center justify-center h-10 opacity-60 hover:opacity-100 transition-opacity duration-300"
          >
            {logo.href ? (
              <a href={logo.href} target="_blank" rel="noopener noreferrer" className="h-full">
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="h-full w-auto object-contain filter brightness-0 invert"
                />
              </a>
            ) : (
              <img
                src={logo.src}
                alt={logo.alt}
                className="h-full w-auto object-contain filter brightness-0 invert"
              />
            )}
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes carma-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  )
}
