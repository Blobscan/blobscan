import { NotFoundErrorView } from "~/components/ErrorViews/NotFoundErrorView";

export default function Custom404() {
  return (
    <NotFoundErrorView
      title="Page Not Found"
      description="Sorry, we couldn&rsquo;t find the page you&rsquo;re looking for."
    />
  );
}
