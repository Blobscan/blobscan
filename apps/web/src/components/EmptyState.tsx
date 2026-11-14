import cn from "classnames";

import type { Size } from "~/types";
import { EmptyBlob } from "./EmptyBlob";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  size?: Size;
  description?: string;
}

export function EmptyState({ size = "md", description }: EmptyStateProps) {
  return (
    <div
      className={cn(
        styles.reveal,
        "flex h-full w-full flex-col items-center justify-center gap-4 text-contentTertiary-light dark:text-contentTertiary-dark",
        {
          "text-sm": size === "sm",
          "text-base": size !== "sm",
        }
      )}
    >
      <EmptyBlob
        className={cn("h-auto max-w-full shrink-0 opacity-50", {
          "w-[150px]": size === "sm",
          "w-[150px] sm:w-[200px]": size === "md",
          "w-[200px] lg:w-[330px]": size === "lg",
        })}
      />
      <p className="opacity-50">{description ?? "No Data Available"}</p>
    </div>
  );
}
