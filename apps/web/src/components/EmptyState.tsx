import Image from "next/image";
import cn from "classnames";

import type { Size } from "~/types";

export interface EmptyStateProps {
  size?: Size;
  description?: string;
}

export function EmptyState({ size = "md", description }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-4 text-contentTertiary-light dark:text-contentSecondary-dark dark:opacity-30",
        {
          "text-sm": size === "sm",
          "text-base": size !== "sm",
        }
      )}
    >
      <Image
        src="/empty.png"
        alt="Empty Icon"
        width={330}
        height={150}
        sizes="(max-width: 768px) 120px, (max-width: 1024px) 200px, 250px"
        className={cn("opacity-50 dark:opacity-100", {
          "h-[70px] w-[150px]": size === "sm",
          "h-[150px] w-[150px] sm:h-[100px] sm:w-[200px]": size === "md",
          "h-[100px] w-[200px] lg:h-[150px] lg:w-[330px]": size === "lg",
        })}
        priority
      />
      <p>{description ?? "No Data Available"}</p>
    </div>
  );
}
