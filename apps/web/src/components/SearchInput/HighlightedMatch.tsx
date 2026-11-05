import type { FC } from "react";
import cn from "classnames";

export const HighlightedMatch: FC<{
  value: string | number;
  term: string | number;
}> = function ({ term, value }) {
  // A hex value can be in lower case or in checksum case. Ignore the letter case.
  const isHighlighted =
    value.toString().toLowerCase() === term.toString().toLowerCase();

  return (
    <span
      className={cn("truncate", {
        "bg-primary-300 text-content-light dark:bg-primary-700 dark:text-content-dark":
          isHighlighted,
      })}
    >
      {value}
    </span>
  );
};
