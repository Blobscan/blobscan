import type { FC } from "react";
import { useState } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";

import Copy from "~/icons/copy.svg";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

type CopyToClipboardProps = {
  label?: string;
  value: string;
};

export const CopyToClipboard: FC<CopyToClipboardProps> = ({ label, value }) => {
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
};
