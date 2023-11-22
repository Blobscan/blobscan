import { useIsMounted } from '../hooks/useIsMounted'
import { useTheme } from 'next-themes'
import NextImage from 'next/image'
import Link from 'next/link'

export const Logo = ({ className = '' }) => {
  const { resolvedTheme } = useTheme()
  const isMounted = useIsMounted()
  const logoSrc =
    resolvedTheme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'

  if (!isMounted) {
    return <div className={className} />
  }

  return (
    <Link href="/">
      <NextImage
        className={className}
        src={logoSrc}
        width="0"
        height="0"
        sizes="100vw"
        priority
        alt="blobscan-logo"
      />
    </Link>
  )
}

export const Logomark = ({ className = '' }) => {
  const isMounted = useIsMounted()

  if (!isMounted) {
    return <div className={className} />
  }

  return (
    <Link href="/">
      <NextImage
        className={className}
        src={'/logomark.svg'}
        width="0"
        height="0"
        sizes="100vw"
        priority
        alt="blobscan-logomark"
      />
    </Link>
  )
}
