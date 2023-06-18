import { type FC } from "react";
import { animated, useSpring } from "@react-spring/web";
import cn from "classnames";

import { Card } from "./Card";

export type MetricCardProps = {
  name: string;
  compact?: boolean;
  value?: number;
  unit?: string;
};

export const MetricCard: FC<MetricCardProps> = function ({
  name,
  compact = false,
  value = 0,
  unit,
}) {
  const isInteger = Number.isInteger(value);
  const props = useSpring({ value: Number(value), from: { value: 0 } });

  return (
    <Card compact={compact}>
      <div
        className={cn(
          {
            "sm:gap-4": !compact,
            "sm:gap-1": compact,
          },
          "flex flex-col gap-1",
        )}
      >
        <div
          className={cn("text-xs font-semibold", {
            "sm:text-xs": compact,
            "sm:text-sm": !compact,
          })}
        >
          {name}
        </div>
        <div className="flex gap-2">
          <div
            className={cn(
              {
                "text-lg sm:text-xl": compact,
                "text-xl lg:text-4xl": !compact,
              },
              "font-semibold",
            )}
          >
            {value ? (
              <animated.div>
                {props.value.to((x) =>
                  (isInteger ? Math.trunc(x) : x.toFixed(2)).toLocaleString(),
                )}
              </animated.div>
            ) : (
              0
            )}
          </div>
          {unit && (
            <div className="absolute flex items-end gap-3">
              <div
                className={cn("invisible", {
                  "text-lg sm:text-xl": compact,
                  "text-xl lg:text-4xl": !compact,
                })}
              >
                {value.toLocaleString()}
              </div>
              <div
                className={cn(
                  "relative bottom-1 text-xs font-semibold text-contentSecondary-light dark:text-contentSecondary-dark md:bottom-0.5 lg:bottom-1 lg:left-0.5",
                  { "sm:bottom-1 sm:text-xs": compact },
                  { "sm:bottom-1 sm:text-sm": !compact },
                )}
              >
                {unit}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
