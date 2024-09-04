import { useRouter } from "next/router";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

import { IconButton } from "./IconButton";

export function NavArrows({ next, prev }: { next?: string; prev?: string }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <NavArrow type="prev" href={prev} />
      <NavArrow type="next" href={next} />
    </div>
  );
}

function NavArrow({ type, href }: { type: "next" | "prev"; href?: string }) {
  const router = useRouter();

  return (
    <IconButton
      onClick={() => {
        if (href) {
          router.push(href);
        }
      }}
      className={`
          dark:bg-neutral-850
          bg-border-border-dark
          rounded-md
          border
          border-border-light
          bg-white
          p-1
          dark:border-border-dark
          dark:bg-border-dark
          ${href ? "" : "cursor-default opacity-50"}
      `}
      disabled={!href}
    >
      {type === "next" ? (
        <ChevronRightIcon className="h-4 w-4" />
      ) : (
        <ChevronLeftIcon className="h-4 w-4" />
      )}
    </IconButton>
  );
}
