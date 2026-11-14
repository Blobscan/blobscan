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
    <section className="mx-auto mt-12 flex w-full max-w-4xl flex-col-reverse items-center justify-center gap-6 py-6 md:mt-[72px] md:min-h-[460px] md:flex-row md:gap-12 md:py-10 lg:gap-16">
      <div className="w-full max-w-sm text-center md:w-[320px] md:shrink-0 md:text-left">
        <p className="text-5xl font-semibold leading-none tracking-tight text-accent-light dark:text-accent-dark md:text-6xl">
          {code}
        </p>
        <h1 className="mx-auto mt-5 max-w-[320px] whitespace-pre-line text-4xl font-semibold leading-[1.12] tracking-[-0.035em] text-content-light dark:text-content-dark md:mx-0 md:text-[46px]">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-[300px] text-[15px] leading-7 text-contentSecondary-light dark:text-contentSecondary-dark md:mx-0">
          {description}
        </p>
        <div className="mt-8">{action}</div>
      </div>
      <div className="w-[56vw] max-w-[260px] shrink-0 md:w-[240px] md:min-w-0 md:max-w-none md:shrink lg:w-[360px] xl:w-[400px]">
        {image}
      </div>
    </section>
  );
}
