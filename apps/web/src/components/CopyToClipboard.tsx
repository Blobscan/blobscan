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

  // TODO: Use Button component
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
        onClick={() => {
          navigator.clipboard.writeText(value);
          setIsCopied(true);
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
      {value}
      <CopyToClipboard value={value} label={label} />
    </div>
  );
}
