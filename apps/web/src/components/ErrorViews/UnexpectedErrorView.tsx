import Image from "next/image";

import { ReloadButton } from "../ReloadButton";

export function UnexpectedErrorView() {
  return (
    <main className="flex h-screen w-full flex-col items-center justify-center  gap-4 sm:h-fit">
      <Image
        src="/unexpected-error.png"
        alt="Unexpected error"
        width={650}
        height={650}
        sizes="(max-width: 768px) 450px, (max-width: 1024px) 550px, 650px"
        className="h-[250px] w-[300px] md:h-[350px] md:w-[350px] lg:h-[450px] lg:w-[650px]"
      />
      <h1 className="-mt-14 text-2xl tracking-tight text-content-light dark:text-content-dark sm:-mt-20 sm:text-4xl">
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
