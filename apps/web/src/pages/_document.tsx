/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import NextDocument, { Head, Html, Main, NextScript } from "next/document";

//boilerplate for persistent mode when reload page
//not working correctly..
export default class Document extends NextDocument {
  render() {
    return (
      <Html lang="en" className="dark h-full">
        <Head>
          <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        </Head>
        <body
          className={`
        dark:bg-background-dark
        bg-background-light
        dark:text-content-dark
        text-content-light
        h-full
        `}
        >
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
