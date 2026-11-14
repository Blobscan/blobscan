import { ReloadButton } from "../ReloadButton";
import { ConcernedBlob } from "./ConcernedBlob";

export function UnexpectedErrorView() {
  return (
    <main className="flex h-screen w-full flex-col items-center justify-center  gap-4 sm:h-fit">
      <ConcernedBlob className="h-auto w-[250px] max-w-full md:w-[350px] lg:w-[450px]" />
      <h1 className="mt-4 text-2xl tracking-tight text-content-light dark:text-content-dark sm:text-4xl">
        Well, this is awkward…
      </h1>
      <p className="w-5/6 text-center text-base text-contentSecondary-light dark:text-contentSecondary-dark sm:w-2/6">
        We&apos;re not exactly sure what happened, but something went wrong.
        Please try reloading the page.
      </p>
      <ReloadButton className="mt-7 w-60" />
    </main>
  );
}
