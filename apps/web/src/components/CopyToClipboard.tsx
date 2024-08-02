import { useState } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";

import Copy from "~/icons/copy.svg";

export function CopyToClipboard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [isCopied, setCopied] = useState(false);
  const [isHover, setIsHover] = useState(false);

  return (
    <button
      className="relative cursor-pointer text-contentTertiary-light hover:text-link-light dark:text-contentTertiary-dark dark:hover:text-link-dark"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => {
        setIsHover(false);
        setCopied(false);
      }}
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
      <div
        className={`pointer-events-none absolute -top-[35px] left-[50%] z-10 -translate-x-[50%] ${
          isHover ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="whitespace-nowrap rounded-full bg-accent-light px-3 py-1.5 text-xs text-white dark:bg-primary-500">
          {isCopied ? "Copied!" : label}
        </div>
        <div className="absolute bottom-0 left-[50%] h-2 w-2 -translate-x-[50%] translate-y-[50%] rotate-45 bg-accent-light dark:bg-primary-500" />
      </div>
    </button>
  );
}
