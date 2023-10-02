import "../styles/globals.css";
import "@upstash/feedback/index.css";
import type { AppProps as NextAppProps } from "next/app";
import FeedbackWidget from "@upstash/feedback";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider, useTheme } from "next-themes";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import Head from "next/head";
import { useRouter } from "next/router";
import { SkeletonTheme } from "react-loading-skeleton";

import AppLayout from "~/components/AppLayout/AppLayout";
import { api } from "~/api-client";
import { useIsMounted } from "~/hooks/useIsMounted";

function App({ Component, pageProps }: NextAppProps) {
  const { resolvedTheme } = useTheme();
  const isMounted = useIsMounted();
  const { pathname, query } = useRouter();
  const { data: webhookDefined, isLoading } = api.webhookCheck.useQuery();
  const renderFeedbackWidget = webhookDefined && !isLoading;

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
        {renderFeedbackWidget && (
          <div className="text-content-light">
            <FeedbackWidget
              type="full"
              // We need to specify the api path to be absolute to
              // solve: https://github.com/upstash/feedback/issues/5
              apiPath="/api/feedback"
              themeColor={resolvedTheme === "dark" ? "#9A71F2" : "#5D25D4"}
              textColor="#FFF"
              title="Hi 👋"
              description="Have feedback? We'd love to hear it"
              user="anon"
              metadata={{
                pathname: pathname,
                query: query,
              }}
            />
          </div>
        )}
        <Component {...pageProps} />
      </AppLayout>
      <Analytics />
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
