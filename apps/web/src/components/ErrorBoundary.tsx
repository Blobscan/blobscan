import type { FC } from "react";
import React from "react";
import { ErrorBoundary as SentryErrorBoundary } from "@sentry/nextjs";

import { UnexpectedErrorView } from "./ErrorViews/UnexpectedErrorView";

export const ErrorBoundary: FC<{ children: React.ReactNode }> =
  function ErrorBoundary({ children }) {
    return (
      <SentryErrorBoundary fallback={<UnexpectedErrorView />}>
        {children}
      </SentryErrorBoundary>
    );
  };
