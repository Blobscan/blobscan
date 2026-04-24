import { CheckCircleIcon } from "@heroicons/react/24/outline";

import { Button } from "~/components/Button";

export function SuccessScreen({
  onClose,
  onPostMore,
}: {
  onClose: () => void;
  onPostMore(): void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6 pt-1">
      <CheckCircleIcon className="h-12 w-12 text-green-500" />
      <p className="text-center">Thank you for your feedback!</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onPostMore}>
          Post More
        </Button>
        <Button
          type="button"
          onClick={onClose}
          className="flex flex-1 justify-center"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
