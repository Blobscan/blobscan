import "../styles/globals.css";
import "@upstash/feedback/index.css";
import type { AppProps as NextAppProps } from "next/app";
import {
  ThemeProvider as MUIThemeProvider,
  createTheme,
} from "@mui/material/styles";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider, useTheme } from "next-themes";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import { useMemo } from "react";
import Head from "next/head";
import { SkeletonTheme } from "react-loading-skeleton";

import AppLayout from "~/components/AppLayout/AppLayout";
import { FeedbackWidget } from "~/components/FeedbackWidget";
import { api } from "~/api-client";
import { env } from "~/env.mjs";
import { useIsMounted } from "~/hooks/useIsMounted";
import { BlobDecoderWorkerProvider } from "~/providers/BlobDecoderWorker";

const muiLightTheme = createTheme({
  palette: {
    mode: "light",
  },
});
const muiDarkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App({ Component, pageProps }: NextAppProps) {
  const { resolvedTheme } = useTheme();
  const isMounted = useIsMounted();

  const muiTheme = useMemo(
    () => (resolvedTheme === "dark" ? muiDarkTheme : muiLightTheme),
    [resolvedTheme]
  );

  if (!isMounted) {
    return null;
  }

  return (
    <MUIThemeProvider theme={muiTheme}>
      <SkeletonTheme
        baseColor={resolvedTheme === "dark" ? "#434672" : "#EADEFD"}
        highlightColor={resolvedTheme === "dark" ? "#7D80AB" : "#E2CFFF"}
      >
        <Head>
          <title>Dillscan</title>
          <meta
            name="description"
            content="Dillscan is a Blob Transaction explorer, a web-based application that offers a seamless experience for navigating and indexing blob data."
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <AppLayout>
          <Component {...pageProps} />
        </AppLayout>
        <FeedbackWidget />
        {env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED && <Analytics />}
      </SkeletonTheme>
    </MUIThemeProvider>
  );
}

function AppWrapper(props: NextAppProps) {
  return (
    <ThemeProvider attribute="class">
      <BlobDecoderWorkerProvider>
        <App {...props} />
      </BlobDecoderWorkerProvider>
    </ThemeProvider>
  );
}

export default api.withTRPC(AppWrapper);
