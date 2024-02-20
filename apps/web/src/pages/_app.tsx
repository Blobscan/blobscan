import "../styles/globals.css";
import "@upstash/feedback/index.css";
import type { AppProps as NextAppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider, useTheme } from "next-themes";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import Head from "next/head";
import { SkeletonTheme } from "react-loading-skeleton";

import AppLayout from "~/components/AppLayout/AppLayout";
import { FeedbackWidget } from "~/components/FeedbackWidget";
import { api } from "~/api-client";
import { env } from "~/env.mjs";
import { useIsMounted } from "~/hooks/useIsMounted";

function App({ Component, pageProps }: NextAppProps) {
  const { resolvedTheme } = useTheme();
  const isMounted = useIsMounted();

  if (!isMounted) {
    return null;
  }

  return (
    <SkeletonTheme
      baseColor={resolvedTheme === "dark" ? "#434672" : "#EADEFD"}
      highlightColor={resolvedTheme === "dark" ? "#7D80AB" : "#E2CFFF"}
    >
      <Head>
        <title>Blobscan</title>
        <meta
          name="description"
          content="Blobscan is the first EIP4844 Blob Transaction explorer, a web-based application that offers a seamless experience for navigating and indexing blob data."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
      <FeedbackWidget />
      {env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED && <Analytics />}
    </SkeletonTheme>
  );
}

function AppWrapper(props: NextAppProps) {
  return (
    <ThemeProvider attribute="class">
      <App {...props} />
    </ThemeProvider>
  );
}

export default api.withTRPC(AppWrapper);
