import type { FC } from "react";
import { animated, useSpring } from "@react-spring/web";
import cn from "classnames";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { formatNumber } from "~/utils";
import { Card } from "./Card";

export type MetricCardProps = Partial<{
  name: string;
  compact: boolean;
  value?: bigint | number;
  unit: string;
}>;

export const MetricCard: FC<MetricCardProps> = function ({
  name,
  compact = false,
  value,
  unit,
}) {
  const isInteger = Number.isInteger(value);
  const props = useSpring({
    value: Number(value),
    from: { value: 0 },
    cancel: !value,
  });

  return (
    <Card compact={compact}>
      <div
        className={cn(
          {
            "sm:gap-4": !compact,
            "sm:gap-1": compact,
          },
          "flex flex-col gap-1"
        )}
      >
        <div
          className={cn("text-xs font-semibold", {
            "sm:text-xs": compact,
            "sm:text-sm": !compact,
          })}
        >
          {name ?? <Skeleton width={80} height={20} />}
        </div>
        <div className="flex gap-2">
          {value !== undefined ? (
            <>
              <div
                className={cn(
                  {
                    "text-lg sm:text-xl": compact,
                    "text-xl lg:text-4xl": !compact,
                  },
                  "font-semibold"
                )}
              >
                {value !== undefined ? (
                  <animated.div>
                    {props.value.to((x) =>
                      formatNumber(isInteger ? Math.trunc(x) : x.toFixed(2))
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
                    {formatNumber(value)}
                  </div>
                  <div
                    className={cn(
                      "relative bottom-1 text-xs font-semibold text-contentSecondary-light dark:text-contentSecondary-dark md:bottom-0.5 lg:bottom-1 lg:left-0.5",
                      { "sm:bottom-1 sm:text-xs": compact },
                      { "sm:bottom-1 sm:text-sm": !compact }
                    )}
                  >
                    {unit}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="block sm:hidden">
                <Skeleton height={compact ? 20 : 30} width={80} />
              </div>
              <div className="hidden sm:block">
                <Skeleton
                  height={compact ? 20 : 40}
                  width={compact ? 100 : 120}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
