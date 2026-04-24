import { CheckCircleIcon } from "@heroicons/react/24/outline";

import { Button } from "~/components/Button";

export function SuccessScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6 pt-1">
      <CheckCircleIcon className="h-12 w-12 text-green-500" />
      <p className="text-center">Thank you for your feedback!</p>
      <Button type="button" onClick={onClose} className="w-full">
        Close
      </Button>
    </div>
  );
}
