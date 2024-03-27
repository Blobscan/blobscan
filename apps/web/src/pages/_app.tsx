import "../styles/globals.css";
import "@upstash/feedback/index.css";
import type { AppProps as NextAppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider, useTheme } from "next-themes";

import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
  lightTheme,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { gnosis } from "wagmi/chains";

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

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: "Blobscan",
  projectId: "2627905d89c24606408ed846fa9dc8ce", //env.NEXT_PUBLIC_PROJECT_ID,
  chains: [gnosis],
  ssr: false,
});

function App({ Component, pageProps }: NextAppProps) {
  const { resolvedTheme } = useTheme();
  const isMounted = useIsMounted();

  if (!isMounted) {
    return null;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          theme={
            resolvedTheme === "dark"
              ? darkTheme({
                  accentColor: "#9A71F2",
                })
              : lightTheme({
                  accentColor: "#5D25D4",
                })
          }
        >
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
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
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
