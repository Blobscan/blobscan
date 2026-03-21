import Head from "next/head";

const DEFAULT_TITLE = "Blobscan";
const DEFAULT_DESCRIPTION =
  "Blobscan is the first EIP4844 Blob Transaction explorer, a web-based application that offers a seamless experience for navigating and indexing blob data.";
const OG_IMAGE_PATH = "/og-image.png";

type SeoMetaTagsProps = {
  title?: string;
  description?: string;
};

export function SeoMetaTags({
  title,
  description = DEFAULT_DESCRIPTION,
}: SeoMetaTagsProps = {}) {
  const fullTitle = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={OG_IMAGE_PATH} />
      <meta property="og:site_name" content={DEFAULT_TITLE} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE_PATH} />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}
