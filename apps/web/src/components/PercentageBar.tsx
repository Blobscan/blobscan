import type { FC } from "react";
import { animated, useSpring } from "@react-spring/web";
import cn from "classnames";

import type { Numerish } from "~/utils";
import { calculatePercentage } from "~/utils";

export type Color = "green" | "red" | "purple" | "grey";

export type PercentageBarProps = {
  value: Numerish;
  total: Numerish;
  compact?: boolean;
  color?: Color;
  width?: number;
  hidePercentage?: boolean;
};

export const PercentageBar: FC<PercentageBarProps> = function ({
  value,
  total,
  compact = false,
  width = 98,
  color = "purple",
  hidePercentage,
}) {
  const percentage = calculatePercentage(value, total, {
    asFraction: true,
  });
  const barPercentageProps = useSpring({
    value: percentage,
    from: { value: 0 },
    cancel: !percentage,
  });

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <div
          style={{
            width,
          }}
          className={cn("rounded-md bg-primary-200 dark:bg-primary-800", {
            "h-0.5 ": compact,
            "h-1 w-24": !compact,
          })}
        />
        <animated.div
          className={cn("absolute top-0 rounded-md", {
            "h-1": !compact,
            "h-0.5": compact,
            "bg-positive-light dark:bg-positive-dark": color === "green",
            "bg-contentTertiary-light dark:bg-contentTertiary-dark":
              color === "grey",
            "bg-primary-700 dark:bg-primary-500": color === "purple",
            "bg-negative-light dark:bg-negative-dark": color === "red",
          })}
          style={{
            width: barPercentageProps.value.to((x) => `${x * width}px`),
          }}
        />
      </div>
      {!hidePercentage && (
        <animated.div
          className={cn(
            "text-contentTertiary-light dark:text-contentTertiary-dark",
            {
              "text-[10px]": compact,
            }
          )}
        >
          {barPercentageProps.value.to(
            (x) => `${Number((x * 100).toFixed(2))}%`
          )}
        </animated.div>
      )}
    </div>
  );
};
