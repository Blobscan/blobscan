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
        title={"This page\nis missing"}
        description="We could not find a page at this address. Check the address or return to the homepage."
      />
    </>
  );
}
