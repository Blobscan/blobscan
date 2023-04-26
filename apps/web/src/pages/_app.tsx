import "../styles/globals.css";
import type { AppProps as NextAppProps } from "next/app";
import { ThemeProvider } from "next-themes";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import Head from "next/head";

import AppLayout from "~/components/AppLayout/AppLayout";
import { api } from "~/api";

function MyApp({ Component, pageProps }: NextAppProps) {
  return (
    <ThemeProvider attribute="class">
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
    </ThemeProvider>
  );
}

export default api.withTRPC(MyApp);
