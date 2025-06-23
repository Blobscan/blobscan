import withSearch from './src/markdoc/search.mjs'
import withMarkdoc from '@markdoc/next.js'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.NEXT_BUILD_OUTPUT,
  pageExtensions: ['js', 'jsx', 'md'],
  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: !!process.env.CI },
  typescript: { ignoreBuildErrors: !!process.env.CI },
}

export default withSearch(
  withMarkdoc({ schemaPath: './src/markdoc' })(nextConfig)
)
