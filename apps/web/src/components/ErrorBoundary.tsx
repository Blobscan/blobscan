import type { FC } from "react";
import React from "react";
import Image from "next/image";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { ErrorBoundary as SentryErrorBoundary } from "@sentry/nextjs";

import { Button } from "./Button";
import { Icon } from "./Icon";

export const ErrorBoundary: FC<{ children: React.ReactNode }> =
  function ErrorBoundary({ children }) {
    return (
      <SentryErrorBoundary
        fallback={
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
              We&apos;re not exactly sure what happened, but something went
              wrong. Please try reloading the page.
            </p>
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
              className="mt-7 w-52"
            >
              <div className="flex items-center justify-center gap-1">
                <Icon src={ArrowPathIcon} size="md" />
                Reload
              </div>
            </Button>
          </main>
        }
      >
        {children}
      </SentryErrorBoundary>
    );
  };
