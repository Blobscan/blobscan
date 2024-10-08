import type { FC } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

export type ErrorMessageProps = {
  error: string | Error;
};

export const ErrorMessage: FC<ErrorMessageProps> = function ({ error }) {
  return (
    <div className="flex h-32 w-full items-center justify-center gap-2 text-base text-error-600 dark:text-error-300">
      <ExclamationCircleIcon className="h-10 w-10" />
      <div>{error instanceof Error ? error.message : error}</div>
    </div>
  );
};
