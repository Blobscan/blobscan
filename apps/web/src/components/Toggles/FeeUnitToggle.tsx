import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/20/solid";
import classNames from "classnames";

export const FEE_UNITS = ["eth", "usd"] as const;

export type FeeUnit = (typeof FEE_UNITS)[number];

// Keep it the same as the duration-300 classes below.
const SLIDE_DURATION_MS = 300;

type FeeUnitToggleProps = {
  unit: FeeUnit;
  onChange: (unit: FeeUnit) => void;
  /**
   * The text of each unit, for example the unit of a chart axis ("Gwei").
   */
  labels: Record<FeeUnit, string>;
  /**
   * "inline" is a small pill for a chart header. "control" has the style of
   * the selects of a control bar.
   */
  variant?: "inline" | "control";
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getOtherUnit(unit: FeeUnit): FeeUnit {
  return unit === "eth" ? "usd" : "eth";
}

/**
 * A pill that shows the current unit. A click switches to the other unit.
 */
export const FeeUnitToggle: FC<FeeUnitToggleProps> = ({
  unit,
  onChange,
  labels,
  variant = "inline",
}) => {
  // The parent can mount a new toggle when the unit changes (e.g. a new
  // chart). Thus, the labels move first, and onChange runs after the slide.
  // A timer is used, not transitionend, because a background tab does not
  // run the transition.
  const [selected, setSelected] = useState(unit);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setSelected(unit);
  }, [unit]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleClick = () => {
    const nextUnit = getOtherUnit(selected);

    setSelected(nextUnit);
    clearTimeout(timeoutRef.current);

    if (prefersReducedMotion()) {
      onChange(nextUnit);
      return;
    }

    timeoutRef.current = setTimeout(
      () => onChange(nextUnit),
      SLIDE_DURATION_MS
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Show values in ${labels[getOtherUnit(selected)]}`}
      className={classNames(
        "items-center text-sm transition-colors focus-visible:outline-none",
        {
          "-mx-1 inline-flex gap-1 rounded-full px-1 py-0.5 text-icon-light hover:text-iconHighlight-light focus-visible:ring-2 focus-visible:ring-accent-light dark:text-icon-dark dark:hover:text-iconHighlight-dark dark:focus-visible:ring-accent-dark":
            variant === "inline",
          "flex h-9 w-full justify-between gap-2 rounded-lg border border-transparent bg-controlBackground-light px-2 text-left shadow-md hover:border focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white active:border-controlBorderHighlight-dark dark:bg-controlBackground-dark dark:hover:border-controlBorderHighlight-dark":
            variant === "control",
        }
      )}
    >
      {/* Both labels are in one grid cell, so the pill has the width of the
      longest one. The current label is in place, and the other one waits
      above (ETH) or below (USD) it. */}
      <span
        className={classNames("grid overflow-hidden", {
          "justify-items-start": variant === "control",
        })}
      >
        {FEE_UNITS.map((u) => (
          <span
            key={u}
            aria-hidden={u !== selected}
            className={classNames(
              "col-start-1 row-start-1 transition-all duration-300 ease-[cubic-bezier(0.4,1.4,0.6,1)] motion-reduce:transition-none",
              {
                "text-center": variant === "inline",
                "translate-y-0 opacity-100": u === selected,
                "-translate-y-full opacity-0": u !== selected && u === "eth",
                "translate-y-full opacity-0": u !== selected && u === "usd",
              }
            )}
          >
            {labels[u]}
          </span>
        ))}
      </span>
      <ArrowsRightLeftIcon
        aria-hidden
        className={classNames(
          "transition-transform duration-300 motion-reduce:transition-none",
          {
            "h-3 w-3": variant === "inline",
            "h-4 w-4 shrink-0 text-icon-light hover:text-iconHighlight-light dark:text-icon-dark dark:hover:text-iconHighlight-dark":
              variant === "control",
            "rotate-180": selected === "usd",
          }
        )}
      />
    </button>
  );
};
