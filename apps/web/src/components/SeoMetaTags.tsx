import Head from "next/head";

const DEFAULT_TITLE = "Blobscan";

type SeoMetaTagsProps = {
  title?: string;
  description?: string;
  /**
   * Absolute canonical URL (for example `https://blobscan.com/blob/0x01...`),
   * for pages that have more than one URL. Leave it unset if you do not know
   * the correct URL: an incorrect canonical URL is worse than none.
   */
  canonicalUrl?: string;
};

export function SeoMetaTags({
  title,
  description,
  canonicalUrl,
}: SeoMetaTagsProps = {}) {
  const fullTitle = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;

  return (
    <Head>
      <title>{fullTitle}</title>
      {description && (
        <>
          <meta name="description" content={description} key="description" />
          <meta
            property="og:description"
            content={description}
            key="og:description"
          />
          <meta
            name="twitter:description"
            content={description}
            key="twitter:description"
          />
        </>
      )}
      <meta property="og:title" content={fullTitle} key="og:title" />
      <meta name="twitter:title" content={fullTitle} key="twitter:title" />
      {canonicalUrl && (
        <link rel="canonical" href={canonicalUrl} key="canonical" />
      )}
    </Head>
  );
}
