import { NotFoundErrorView } from "~/components/ErrorViews/NotFoundErrorView";
import { SeoMetaTags } from "~/components/SeoMetaTags";

export default function Custom404() {
  return (
    <>
      <SeoMetaTags
        title="Page Not Found"
        description="The page you are looking for could not be found."
      />
      <NotFoundErrorView
      title="Page Not Found"
      description="Sorry, we couldn&rsquo;t find the page you&rsquo;re looking for."
    />
    </>
  );
}
