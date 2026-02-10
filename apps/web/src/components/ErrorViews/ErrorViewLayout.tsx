import type { FC, ReactNode } from "react";
import { useRouter } from "next/router";

import { Button } from "../Button";

export interface ErrorViewLayoutProps {
  code: string | number;
  image: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const ErrorViewLayout: FC<ErrorViewLayoutProps> = function ({
  code,
  image,
  title,
  description,
  action,
}) {
  const router = useRouter();

  return (
    <main className="flex h-[calc(100vh-180px)] w-full flex-col items-center justify-center gap-1 sm:flex-row sm:gap-7">
      {image}
      <div className="text-center">
        <div className="text-7xl font-bold text-primary-700 dark:text-primary-500 md:text-9xl">
          {code}
        </div>

        <h1 className="mt-4 text-3xl tracking-tight text-content-light dark:text-content-dark sm:text-4xl">
          {title}
        </h1>

        {description && (
          <p
            className="mt-1 break-words text-sm leading-7 text-contentSecondary-light dark:text-contentSecondary-dark
           sm:mt-6 sm:text-base"
          >
            {description}
          </p>
        )}
        <div className="mt-3 w-full sm:mt-10">
          {action ?? (
            <Button
              variant="primary"
              onClick={() => router.replace("/")}
              className="w-48 sm:w-60"
            >
              Go To Homepage
            </Button>
          )}
        </div>
      </div>
    </main>
  );
};
