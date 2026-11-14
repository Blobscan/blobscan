import type { ReactNode } from "react";

interface ErrorIllustrationLayoutProps {
  code: number;
  title: string;
  description: string;
  action: ReactNode;
  image: ReactNode;
}

export function ErrorIllustrationLayout({
  code,
  title,
  description,
  action,
  image,
}: ErrorIllustrationLayoutProps) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col-reverse items-center justify-center py-4 md:min-h-[460px] md:flex-row md:py-8">
      <div className="w-full max-w-sm text-center md:w-[340px] md:shrink-0 md:text-left">
        <p className="text-xl font-medium text-accent-light dark:text-accent-dark">
          {code}
        </p>
        <h1 className="mx-auto mt-3 max-w-[300px] whitespace-pre-line text-4xl font-medium leading-tight tracking-tight text-content-light dark:text-content-dark md:mx-0 md:text-[44px]">
          {title}
        </h1>
        <p className="mt-5 text-base leading-7 text-contentSecondary-light dark:text-contentSecondary-dark">
          {description}
        </p>
        <div className="mt-7">{action}</div>
      </div>
      <div
        className={`-mb-4 w-[260px] shrink-0 md:mb-0 md:w-[400px] md:min-w-0 md:shrink ${
          code === 500 ? "md:ml-6" : ""
        }`}
      >
        {image}
      </div>
    </section>
  );
}
