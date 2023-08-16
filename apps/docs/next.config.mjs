import withMarkdoc from '@markdoc/next.js'
import { createLoader } from 'simple-functional-loader'

import withSearch from './src/markdoc/search.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md'],
  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: !!process.env.CI },
  webpack(config) {
    config.module.rules.unshift({
      test: /\.md$/,
      use: [
        createLoader(function (source) {
          return (
            source + '\nexport const metadata = frontmatter.nextjs?.metadata;'
          )
        }),
      ],
    })

    return config
  },
}

export default withSearch(
  withMarkdoc({ schemaPath: './src/markdoc' })(nextConfig)
)
