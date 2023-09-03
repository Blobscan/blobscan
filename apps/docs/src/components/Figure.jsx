'use client'

import { useIsMounted } from '@/hooks/useIsMounted'
import { useTheme } from 'next-themes'

function appendThemeToImageSrc(src, theme) {
  const [name, ext] = src.split('.')

  return `${name}-${theme}.${ext}`
}

export const Figure = ({ src, alt, caption, appendCurrentTheme }) => {
  const { resolvedTheme } = useTheme()
  const src_ = appendCurrentTheme
    ? appendThemeToImageSrc(src, resolvedTheme)
    : src
  const isMounted = useIsMounted()

  if (!isMounted) {
    return <div />
  }

  return (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src_} alt={alt} />
      <figcaption>{caption}</figcaption>
    </figure>
  )
}
