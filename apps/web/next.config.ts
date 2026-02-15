import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import path from "path";

// Importing env files here to validate on build
import "./src/env";
import { printBanner } from "./banner";

printBanner();

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

  typescript: { ignoreBuildErrors: !!process.env.CI },

  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default withSentryConfig(config, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
