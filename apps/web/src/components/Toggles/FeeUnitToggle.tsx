import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/20/solid";
import classNames from "classnames";

export const FEE_UNITS = ["eth", "usd"] as const;

export type FeeUnit = (typeof FEE_UNITS)[number];

const DEFAULT_LABELS: Record<FeeUnit, string> = {
  eth: "ETH",
  usd: "USD",
};

// Keep it the same as the duration-300 classes below.
const SLIDE_DURATION_MS = 300;

type FeeUnitToggleProps = {
  unit: FeeUnit;
  onChange: (unit: FeeUnit) => void;
  /**
   * The text of each unit, for example the unit of a chart axis ("Gwei").
   */
  labels?: Record<FeeUnit, string>;
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
  labels = DEFAULT_LABELS,
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
      className="-mx-1 inline-flex items-center gap-1 rounded-full px-1 py-0.5 text-xs text-icon-light transition-colors hover:text-iconHighlight-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light dark:text-icon-dark dark:hover:text-iconHighlight-dark dark:focus-visible:ring-accent-dark"
    >
      {/* Both labels are in one grid cell, so the pill has the width of the
      longest one. The current label is in place, and the other one waits
      above (ETH) or below (USD) it. */}
      <span className="grid overflow-hidden">
        {FEE_UNITS.map((u) => (
          <span
            key={u}
            aria-hidden={u !== selected}
            className={classNames(
              "col-start-1 row-start-1 text-center transition-all duration-300 ease-[cubic-bezier(0.4,1.4,0.6,1)] motion-reduce:transition-none",
              {
                "translate-y-0 opacity-100": u === selected,
                "-translate-y-full opacity-0":
                  u !== selected && u === FEE_UNITS[0],
                "translate-y-full opacity-0":
                  u !== selected && u === FEE_UNITS[1],
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
          "h-3 w-3 transition-transform duration-300 motion-reduce:transition-none",
          { "rotate-180": selected === FEE_UNITS[1] }
        )}
      />
    </button>
  );
};
