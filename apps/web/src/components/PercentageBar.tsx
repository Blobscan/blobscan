import type { FC } from "react";
import { animated, useSpring } from "@react-spring/web";
import classNames from "classnames";

import type { Numerish } from "~/utils";
import { calculatePercentage } from "~/utils";

export type Color = "green" | "red" | "purple" | "grey";

export type PercentageBarProps = {
  value: Numerish;
  total: Numerish;
  compact?: boolean;
  color?: Color;
};

export const PercentageBar: FC<PercentageBarProps> = function ({
  value,
  total,
  compact = false,
  color = "purple",
}) {
  const barSize = compact ? 48 : 96;
  const percentage = calculatePercentage(value, total, {
    asFraction: true,
  });
  const barPercentageProps = useSpring({
    value: percentage,
    from: { value: 0 },
    cancel: !percentage,
  });

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`${
            compact ? "w-12" : "w-24"
          } h-1.5 rounded-md bg-primary-200 dark:bg-primary-800`}
        />
        <animated.div
          className={classNames("absolute top-0 h-1.5 rounded-md", {
            "bg-positive-light dark:bg-positive-dark": color === "green",
            "bg-contentTertiary-light dark:bg-contentTertiary-dark":
              color === "grey",
            "bg-primary-700 dark:bg-primary-500": color === "purple",
            "bg-negative-light dark:bg-negative-dark": color === "red",
          })}
          style={{
            width: barPercentageProps.value.to((x) => `${x * barSize}px`),
          }}
        />
      </div>
      {!compact && (
        <animated.div className="text-contentTertiary-light dark:text-contentTertiary-dark">
          {barPercentageProps.value.to((x) => `${(x * 100).toFixed(2)}%`)}
        </animated.div>
      )}
    </div>
  );
};
