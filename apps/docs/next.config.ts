import withSearch from './src/markdoc/search.mjs'
import withMarkdoc from '@markdoc/next.js'
import { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {},
  reactStrictMode: true,
  output: process.env.NEXT_BUILD_OUTPUT as NextConfig['output'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  pageExtensions: ['js', 'jsx', 'md'],
  /** We already do linting and typechecking as separate tasks in CI */
  typescript: { ignoreBuildErrors: !!process.env.CI },
}

export default withSearch(
  withMarkdoc({ schemaPath: './src/markdoc' })(nextConfig)
)
