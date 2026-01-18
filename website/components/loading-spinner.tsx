"use client"

import Image from "next/image"

interface LoadingSpinnerProps {
  size?: number
  className?: string
}

export function LoadingSpinner({ size = 24, className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <Image src="/carma-logo.png" alt="Loading..." width={size} height={size} className="animate-spin-pulse" />
    </div>
  )
}
