import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";

import { useHover } from "~/hooks/useHover";
import Copy from "~/icons/copy.svg";
import { Tooltip } from "./Tooltip";

type CopyToClipboardProps = {
  label?: string;
  value: string;
};

export function CopyToClipboard({
  label = "Copy to clipboard",
  value,
}: CopyToClipboardProps) {
  const [isCopied, setCopied] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isHovered = useHover(buttonRef);
  useEffect(() => setCopied(false), [isHovered]);

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
      <Tooltip show={isHovered}>
        <div className="whitespace-nowrap">{isCopied ? "Copied!" : label}</div>
      </Tooltip>
    </button>
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
