import Head from "next/head";

const DEFAULT_TITLE = "Blobscan";

type SeoMetaTagsProps = {
  title?: string;
  description?: string;
  /**
   * Root-relative path of the canonical URL (e.g. `/blob/0x01...`), for pages
   * reachable under several URLs. Leave it unset until the path is known: a
   * wrong canonical is worse than none.
   */
  canonicalPath?: string;
};

export function SeoMetaTags({
  title,
  description,
  canonicalPath,
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
      {canonicalPath && (
        <link rel="canonical" href={canonicalPath} key="canonical" />
      )}
    </Head>
  );
}
