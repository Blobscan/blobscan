import { ReloadButton } from "../ReloadButton";
import { ErrorIllustrationLayout } from "./ErrorIllustrationLayout";
import { UnexpectedErrorBlob } from "./UnexpectedErrorBlob";

export function UnexpectedErrorView() {
  return (
    <main className="min-h-screen w-full bg-background-light px-6 py-8 dark:bg-background-dark">
      <ErrorIllustrationLayout
        code="Oops"
        title={"Well, this\nis awkward…"}
        description="Something went wrong. Please reload the page to try again."
        image={<UnexpectedErrorBlob />}
        action={<ReloadButton className="h-auto px-5 py-3" />}
      />
    </main>
  );
}
