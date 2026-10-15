import type { DocumentContext } from "next/document";
import NextDocument, { Head, Html, Main, NextScript } from "next/document";

const DEFAULT_TITLE = "Blobscan";
const DEFAULT_DESCRIPTION =
  "Blobscan is the first EIP4844 Blob Transaction explorer, a web-based application that offers a seamless experience for navigating and indexing blob data.";

export default class Document extends NextDocument<{ baseUrl: string }> {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await NextDocument.getInitialProps(ctx);
    const { req } = ctx;
    const protocol = req?.headers["x-forwarded-proto"] ?? "http";
    const host = req?.headers.host ?? "localhost:3000";
    const baseUrl = `${protocol}://${host}`;
    return { ...initialProps, baseUrl };
  }

  render() {
    const { baseUrl } = this.props;
    const ogImage = `${baseUrl}/blobscan-og.png`;

    return (
      <Html lang="en" className="dark h-full">
        <Head>
          <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
          <link rel="icon" href="/favicon.ico" key="favicon" />
          <meta
            name="description"
            content={DEFAULT_DESCRIPTION}
            key="description"
          />
          <meta property="og:title" content={DEFAULT_TITLE} key="og:title" />
          <meta
            property="og:description"
            content={DEFAULT_DESCRIPTION}
            key="og:description"
          />
          <meta property="og:type" content="website" key="og:type" />
          <meta property="og:image" content={ogImage} key="og:image" />
          <meta
            property="og:site_name"
            content={DEFAULT_TITLE}
            key="og:site_name"
          />
          <meta
            name="twitter:card"
            content="summary_large_image"
            key="twitter:card"
          />
          <meta
            name="twitter:title"
            content={DEFAULT_TITLE}
            key="twitter:title"
          />
          <meta
            name="twitter:description"
            content={DEFAULT_DESCRIPTION}
            key="twitter:description"
          />
          <meta name="twitter:image" content={ogImage} key="twitter:image" />
        </Head>
        <body
          className={`
        h-full
        bg-background-light
        text-content-light
        dark:bg-background-dark
        dark:text-content-dark
        `}
        >
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
