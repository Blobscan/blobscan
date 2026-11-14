import type { FC } from "react";
import { animated } from "@react-spring/web";
import cn from "classnames";

import { useAnimatedPercentage } from "~/hooks/useAnimatedPercentage";
import type { Numerish } from "~/utils";

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
  compact,
  width = 98,
  color = "purple",
  hidePercentage,
}) {
  const barPercentageProps = useAnimatedPercentage(value, total);

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative min-w-0 max-w-full" style={{ width }}>
        <div
          className={cn(
            "w-full rounded-md bg-primary-200 dark:bg-primary-800",
            {
              "h-0.5 ": compact,
              "h-1": !compact,
            }
          )}
        />
        <animated.div
          className={cn("absolute top-0 max-w-full rounded-md", {
            "h-1": !compact,
            "h-0.5": compact,
            "bg-positive-light dark:bg-positive-dark": color === "green",
            "bg-contentTertiary-light dark:bg-contentTertiary-dark":
              color === "grey",
            "bg-primary-700 dark:bg-primary-500": color === "purple",
            "bg-negative-light dark:bg-negative-dark": color === "red",
          })}
          style={{
            width: barPercentageProps.value.to((x) => `${x * 100}%`),
          }}
        />
      </div>
      {!hidePercentage && (
        <>
          <div className="relative h-3 w-12">
            <animated.div
              className={cn(
                "absolute -bottom-1 text-contentTertiary-light dark:text-contentTertiary-dark",
                {
                  "text-[10px]": compact,
                }
              )}
            >
              {barPercentageProps.value.to(
                (x) => `${Number((x * 100).toFixed(2))}%`
              )}
            </animated.div>
          </div>
        </>
      )}
    </div>
  );
};
