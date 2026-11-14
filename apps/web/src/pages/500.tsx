import { InternalServerErrorView } from "~/components/ErrorViews/InternalServerErrorView";
import { SeoMetaTags } from "~/components/SeoMetaTags";

export default function Custom500() {
  return (
    <>
      <SeoMetaTags
        title="Server Error"
        description="An unexpected server error occurred."
      />
      <InternalServerErrorView />
    </>
  );
}
