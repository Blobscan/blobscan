import type { NextPageContext } from "next";
import Error from "next/error";
import { captureUnderscoreErrorException } from "@sentry/nextjs";

import { BadRequestErrorView } from "~/components/ErrorViews/BadRequestErrorView";
import { InternalServerErrorView } from "~/components/ErrorViews/InternalServerErrorView";
import { NotFoundErrorView } from "~/components/ErrorViews/NotFoundErrorView";
import { UnknownErrorView } from "~/components/ErrorViews/UnknownErrorView";

type ErrorCode = "NOT_FOUND" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR";

interface ErrorTextOverride {
  title?: string;
  description?: string;
}

export interface ErrorPageProps {
  error: {
    message: string;
    data?: {
      code: string;
      httpStatus: number;
    } | null;
  };
  overrides?: Partial<Record<ErrorCode, ErrorTextOverride>>;
}

export const ErrorPage = function ({
  error: { data },
  overrides: { BAD_REQUEST, NOT_FOUND } = {},
}: ErrorPageProps) {
  switch (data?.code) {
    case "NOT_FOUND":
      return (
        <NotFoundErrorView
          title={NOT_FOUND?.title ?? "Resource Not Found"}
          description={
            NOT_FOUND?.description ??
            "The resource you are looking for does not exist."
          }
        />
      );
    case "BAD_REQUEST":
      return (
        <BadRequestErrorView
          title={BAD_REQUEST?.title ?? "Bad Request"}
          description={
            BAD_REQUEST?.description ?? "The request you made is invalid."
          }
        />
      );
    case "INTERNAL_SERVER_ERROR":
      return <InternalServerErrorView />;
    default:
      return <UnknownErrorView code={data?.httpStatus ?? 500} />;
  }
};

ErrorPage.getInitialProps = async (contextData: NextPageContext) => {
  // In case this is running in a serverless function, await this in order to give Sentry
  // time to send the error before the lambda exits
  await captureUnderscoreErrorException(contextData);

  // This will contain the status code of the response
  return Error.getInitialProps(contextData);
};

export default ErrorPage;
