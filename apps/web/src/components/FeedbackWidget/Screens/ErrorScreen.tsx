import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import { Button } from "~/components/Button";

export function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6 pt-1">
      <ExclamationCircleIcon className="h-12 w-12 text-red-500" />
      <div className="text-center">
        <p className="font">Something went wrong</p>
        <p className="mt-1 text-sm opacity-60">
          We couldn&apos;t send your feedback.
        </p>
      </div>
      <Button type="button" onClick={onRetry} className="w-full">
        Try Again
      </Button>
    </div>
  );
}
