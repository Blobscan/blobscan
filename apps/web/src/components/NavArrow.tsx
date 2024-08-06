import { useRouter } from "next/router";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export function NavArrows({ next, prev }: { next?: string; prev?: string }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <NavArrow type="Prev" href={prev} />
      <NavArrow type="Next" href={next} />
    </div>
  );
}

function NavArrow({ type, href }: { type: "Next" | "Prev"; href?: string }) {
  const router = useRouter();

  return (
    <button
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
    >
      {type === "Next" ? (
        <ChevronRightIcon className="h-4 w-4" />
      ) : (
        <ChevronLeftIcon className="h-4 w-4" />
      )}
    </button>
  );
}
