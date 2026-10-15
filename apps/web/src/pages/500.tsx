import { SeoMetaTags } from "~/components/SeoMetaTags";

export default function Custom500() {
  return (
    <>
      <SeoMetaTags
        title="Server Error"
        description="An unexpected server error occurred."
      />
      <h1>500 - Server-side error occurred</h1>
    </>
  );
}
