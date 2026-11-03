import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/20/solid";
import classNames from "classnames";

import type { z } from "@blobscan/zod";

import { feeUnitSchema } from "~/schemas/feeUnit";

export const FEE_UNITS = feeUnitSchema.options;

export type FeeUnit = z.infer<typeof feeUnitSchema>;

// Keep it the same as the duration-300 classes below.
const SLIDE_DURATION_MS = 300;

type FeeUnitToggleVariant = "inline" | "control";

type VariantStyle = {
  button: string;
  labelGrid: string;
  label: string;
  icon: string;
  /**
   * The text of each unit. etherUnit is the unit of the Ether values
   * (e.g. "Gwei").
   */
  getLabels: (etherUnit?: string) => Record<FeeUnit, string>;
  /**
   * Run onChange after the slide. This is necessary when the parent mounts
   * a new toggle when the unit changes (e.g. a new chart).
   */
  waitForSlide: boolean;
};

const VARIANT_STYLES: Record<FeeUnitToggleVariant, VariantStyle> = {
  inline: {
    button:
      "-mx-1 inline-flex gap-1 rounded-full px-1 py-0.5 text-icon-light hover:text-iconHighlight-light focus-visible:ring-2 focus-visible:ring-accent-light dark:text-icon-dark dark:hover:text-iconHighlight-dark dark:focus-visible:ring-accent-dark",
    labelGrid: "",
    label: "text-center",
    icon: "h-3 w-3",
    getLabels: (etherUnit) => ({ eth: etherUnit ?? "ETH", usd: "USD" }),
    waitForSlide: true,
  },
  control: {
    button:
      "group flex h-9 w-full justify-between gap-2 rounded-lg border border-transparent bg-controlBackground-light px-2 text-left shadow-md hover:border focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white active:border-controlBorderHighlight-dark dark:bg-controlBackground-dark dark:hover:border-controlBorderHighlight-dark",
    labelGrid: "justify-items-start",
    label: "",
    icon: "h-4 w-4 shrink-0 text-icon-light group-hover:text-iconHighlight-light dark:text-icon-dark dark:group-hover:text-iconHighlight-dark",
    getLabels: (etherUnit) => ({
      eth: etherUnit && etherUnit !== "ETH" ? `Ether (${etherUnit})` : "Ether",
      usd: "USD",
    }),
    waitForSlide: false,
  },
};

type FeeUnitToggleProps = {
  unit: FeeUnit;
  onChange: (unit: FeeUnit) => void;
  /**
   * The unit of the Ether values, for example the unit of a chart axis
   * ("Gwei").
   */
  etherUnit?: string;
  /**
   * "inline" is a small pill for a chart header. "control" has the style of
   * the selects of a control bar.
   */
  variant?: FeeUnitToggleVariant;
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
  etherUnit,
  variant = "inline",
}) => {
  // The labels move first. Then, if the variant must wait for the slide,
  // onChange runs after it. A timer is used, not transitionend, because a
  // background tab does not run the transition.
  const [selected, setSelected] = useState(unit);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const styles = VARIANT_STYLES[variant];
  const labels = styles.getLabels(etherUnit);

  useEffect(() => {
    setSelected(unit);
  }, [unit]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleClick = () => {
    const nextUnit = getOtherUnit(selected);

    setSelected(nextUnit);
    clearTimeout(timeoutRef.current);

    if (!styles.waitForSlide || prefersReducedMotion()) {
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
        styles.button
      )}
    >
      {/* Both labels are in one grid cell, so the pill has the width of the
      longest one. The current label is in place, and the other one waits
      above (ETH) or below (USD) it. */}
      <span className={classNames("grid overflow-hidden", styles.labelGrid)}>
        {FEE_UNITS.map((u) => (
          <span
            key={u}
            aria-hidden={u !== selected}
            className={classNames(
              "col-start-1 row-start-1 transition-all duration-300 ease-[cubic-bezier(0.4,1.4,0.6,1)] motion-reduce:transition-none",
              styles.label,
              {
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
          styles.icon,
          { "rotate-180": selected === "usd" }
        )}
      />
    </button>
  );
};
