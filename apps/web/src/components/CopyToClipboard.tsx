import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";

import { useHover } from "~/hooks/useHover";
import Copy from "~/icons/copy.svg";
import { Tooltip } from "./Tooltip";

export function CopyToClipboard({
  label = "Copy to clipboard",
  value,
}: {
  label?: string;
  value: string;
}) {
  const [isCopied, setCopied] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isHover = useHover(buttonRef);
  useEffect(() => setCopied(false), [isHover]);

  return (
    // TODO: Use Button component
    <button
      ref={buttonRef}
      className="relative cursor-pointer text-contentTertiary-light hover:text-link-light dark:text-contentTertiary-dark dark:hover:text-link-dark"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
      }}
    >
      {isCopied ? (
        <CheckIcon className="h-5 w-5" />
      ) : (
        <Copy className="h-5 w-5" />
      )}
      <Tooltip show={isHover}>
        <div className="whitespace-nowrap">{isCopied ? "Copied!" : label}</div>
      </Tooltip>
    </button>
  );
}
