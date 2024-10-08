import { useState } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";

import Copy from "~/icons/copy.svg";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

type CopyToClipboardProps = {
  label?: string;
  value: string;
};

export function CopyToClipboard({
  label = "Copy to clipboard",
  value,
}: CopyToClipboardProps) {
  const [isCopied, setIsCopied] = useState(false);

  return (
    <Tooltip
      onChange={(open) => {
        if (!open) {
          setIsCopied(false);
        }
      }}
    >
      <TooltipContent>{isCopied ? "Copied!" : label}</TooltipContent>
      <TooltipTrigger
        className="text-contentTertiary-light hover:text-link-light dark:text-contentTertiary-dark dark:hover:text-link-dark"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setIsCopied(true);
          } catch (error) {
            console.error("Failed to copy to clipboard", error);
          }
        }}
      >
        {isCopied ? (
          <CheckIcon className="h-5 w-5" />
        ) : (
          <Copy className="h-5 w-5" />
        )}
      </TooltipTrigger>
    </Tooltip>
  );
}

export function Copyable({ label, value }: CopyToClipboardProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="truncate">{value}</div>
      <CopyToClipboard value={value} label={label} />
    </div>
  );
}
