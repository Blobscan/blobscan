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
      size="sm"
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
          p-[3px]
          dark:border-border-dark
          dark:bg-border-dark
          ${href ? "" : "cursor-default opacity-50"}
      `}
      disabled={!href}
    >
      {type === "next" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
    </IconButton>
  );
}
