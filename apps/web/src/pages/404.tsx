import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "~/components/Button";

export default function Custom404() {
  const router = useRouter();

  return (
    <main className="flex h-[calc(100vh-180px)] w-full flex-col items-center justify-center gap-1 sm:flex-row sm:gap-1">
      <div className="relative">
        <div className="absolute right-[20%] top-[70%] h-0.5 w-0.5 animate-pulse bg-yellow-500 shadow-[0px_0px_88px_39px_rgba(255,149,0,1)] sm:shadow-[0px_0px_300px_56px_rgba(255,149,0,1)]" />
        <Image
          src="/not-found.png"
          alt="404"
          width={500}
          height={500}
          className="h-[200px] w-[200px] md:h-[350px] md:w-[350px] lg:h-[450px] lg:w-[450px]"
        />
      </div>
      <div className="text-center">
        <div className="text-7xl font-bold  md:text-9xl">404</div>

        <h1 className="mt-4 text-3xl tracking-tight text-content-light dark:text-content-dark sm:text-4xl">
          Page Not Found
        </h1>

        <p className="mt-1 text-sm leading-7 text-contentSecondary-light dark:text-contentSecondary-dark sm:mt-6 sm:text-base">
          Sorry, we couldn&rsquo;t find the page you&rsquo;re looking for.
        </p>
        <Button
          variant="primary"
          onClick={() => router.replace("/")}
          className="mt-10 w-48 sm:w-72"
        >
          Go back home
        </Button>
      </div>
    </main>
  );
}
