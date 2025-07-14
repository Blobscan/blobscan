import type { FC } from "react";
import { useState } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";

import Copy from "~/icons/copy.svg";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

type CopyToClipboardProps = {
  tooltipText?: string;
  value: string | number;
};

export const CopyToClipboard: FC<CopyToClipboardProps> = ({
  tooltipText,
  value,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(value.toString());
      setIsCopied(true);
    } catch (error) {
      console.error("Failed to copy to clipboard", error);
    }
  };

  return (
    <Tooltip
      onChange={(open) => {
        if (!open) {
          setIsCopied(false);
        }
      }}
    >
      {(tooltipText || isCopied) && (
        <TooltipContent>{isCopied ? "Copied!" : tooltipText}</TooltipContent>
      )}
      <TooltipTrigger
        className="text-contentTertiary-light hover:text-link-light dark:text-contentTertiary-dark dark:hover:text-link-dark"
        onClick={handleClick}
      >
        {isCopied ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </TooltipTrigger>
    </Tooltip>
  );
};
