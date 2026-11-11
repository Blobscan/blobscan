import "../styles/globals.css";
import type { AppProps as NextAppProps } from "next/app";
import Head from "next/head";
import { ThemeProvider, useTheme } from "next-themes";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import { useEffect } from "react";
import { useRouter } from "next/compat/router";
import { SkeletonTheme } from "react-loading-skeleton";

import AppLayout from "~/components/AppLayout/AppLayout";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { FeedbackWidget } from "~/components/FeedbackWidget/FeedbackWidget";
import { api } from "~/api-client";
import { useIsMainnet } from "~/hooks/useIsMainnet";
import { useIsMounted } from "~/hooks/useIsMounted";
import { AppStateProvider } from "~/providers/AppState";
import { BlobDecoderWorkerProvider } from "~/providers/BlobDecoderWorker";
import { EnvProvider, useEnv } from "~/providers/Env";
import emptyImage from "../../public/empty.webp";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _mtm: any[];
  }
}

function App({ Component, pageProps }: NextAppProps) {
  const { resolvedTheme } = useTheme();
  const isMounted = useIsMounted();
  const isMainnet = useIsMainnet();
  const router = useRouter();
  const { env } = useEnv();

  useEffect(() => {
    if (!env?.PUBLIC_MATOMO_TAG_MANAGER_CONTAINER_URL) {
      return;
    }

    const _mtm = (window._mtm = window._mtm || []);
    _mtm.push({ "mtm.startTime": new Date().getTime(), event: "mtm.Start" });
    const d = document,
      g = d.createElement("script"),
      s = d.getElementsByTagName("script")[0];
    g.async = true;
    g.src = env.PUBLIC_MATOMO_TAG_MANAGER_CONTAINER_URL;

    if (s) {
      s.parentNode?.insertBefore(g, s);
    }
  }, [env?.PUBLIC_MATOMO_TAG_MANAGER_CONTAINER_URL]);

  if (!router || !router.isReady || !isMounted) {
    return null;
  }

  return (
    <SkeletonTheme
      baseColor={resolvedTheme === "dark" ? "#434672" : "#EADEFD"}
      highlightColor={resolvedTheme === "dark" ? "#7D80AB" : "#E2CFFF"}
    >
      <AppLayout>
        {(router.pathname !== "/stat/eth-price" || isMainnet === true) && (
          <Component {...pageProps} />
        )}
      </AppLayout>
      <FeedbackWidget />
    </SkeletonTheme>
  );
}

function AppWrapper(props: NextAppProps) {
  return (
    <ErrorBoundary>
      <Head>
        <link rel="preload" as="image" href={emptyImage.src} />
      </Head>
      <ThemeProvider attribute="class">
        <BlobDecoderWorkerProvider>
          <EnvProvider>
            <AppStateProvider>
              <App {...props} />
            </AppStateProvider>
          </EnvProvider>
        </BlobDecoderWorkerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default api.withTRPC(AppWrapper);
