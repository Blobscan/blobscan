import NextDocument, { Head, Html, Main, NextScript } from "next/document";
import { Analytics } from "@vercel/analytics/react";

export default class Document extends NextDocument {
  render() {
    return (
      <Html lang="en" className="dark h-full">
        <Head>
          <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
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
          <Analytics />
        </body>
      </Html>
    );
  }
}
