import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import path from "path";

// Importing env files here to validate on build
import "./src/env";
import { printBanner } from "./banner";

printBanner();

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const config: NextConfig = {
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  reactStrictMode: true,
  output: process.env.NEXT_BUILD_OUTPUT as NextConfig["output"],
  async rewrites() {
    /**
     * Redirect Grafana's metrics scrape requests from /metrics to the Next.js
     * standard endpoint at /api/metrics.
     */
    return [
      {
        source: "/metrics",
        destination: "/api/metrics",
      },
    ];
  },
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@blobscan/api",
    "@blobscan/auth",
    "@blobscan/db",
    "@blobscan/tailwind-config",
    "echarts",
    "zrender",
  ],
  webpack(config) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find(
      (rule: { test?: { test?: (arg0: string) => boolean } }) =>
        rule.test?.test?.(".svg")
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: [
          {
            loader: "@svgr/webpack",
            options: {
              icon: true,
              typescript: true,
              ext: "tsx",
            },
          },
        ],
      }
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },

  typescript: { ignoreBuildErrors: !!process.env.CI },

  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default withSentryConfig(bundleAnalyzer(config), {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
