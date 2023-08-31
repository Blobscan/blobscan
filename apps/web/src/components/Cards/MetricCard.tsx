import type { FC } from "react";
import { animated, useSpring } from "@react-spring/web";
import cn from "classnames";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { formatNumber } from "~/utils";
import { Card } from "./Card";

export type MetricProp = {
  value?: bigint | number;
  numberFormatOpts?: Intl.NumberFormatOptions;
  unit?: string;
};
export type MetricCardProps = Partial<{
  name: string;
  compact: boolean;
  metric: MetricProp;
  secondaryMetric?: MetricProp;
}>;

function isInteger(value: bigint | number) {
  return Number.isInteger(value) || typeof value === "bigint";
}

function MetricLayout({
  children,
  isSecondary,
  compact,
}: {
  children: React.ReactNode;
  compact?: boolean;
  isSecondary?: boolean;
}) {
  return (
    <div
      className={cn(
        {
          "text-lg sm:text-xl": compact,
          "text-lg lg:text-2xl": !compact,
        },
        "font-semibold",
        {
          "text-sm text-contentSecondary-light dark:text-contentSecondary-dark lg:text-base":
            isSecondary,
        }
      )}
    >
      {children}
    </div>
  );
}

/**
 *  Creates a placeholder string that takes up the maximum amount of space the input could take with
 *  that amount of characters
 */
function createPlaceholder(input: string): string {
  /**
   * We replace all numeric characters with '8' because '8' takes up the most pixels compared to
   * other numbers
   */
  const replacedString = input.replace(/[0-9]/g, "8");
  return replacedString;
}

function Metric({
  value,
  numberFormatOpts,
  unit,
  compact,
  isSecondary = false,
}: MetricProp & { compact?: boolean; isSecondary?: boolean }) {
  const isValueInteger = value && isInteger(value);
  const valueProps = useSpring({
    value: Number(value),
    from: { value: 0 },
    cancel: !value,
  });

  /* The number 8 takes up the most pixels compare to other numbers */
  const formattedNumber =
    value !== undefined
      ? formatNumber(value, compact ? "compact" : undefined, numberFormatOpts)
      : "";

  return (
    <div>
      {value !== undefined ? (
        <div className="flex gap-2">
          <MetricLayout compact={compact} isSecondary={isSecondary}>
            {value !== undefined ? (
              <animated.div>
                {valueProps.value.to((x) => {
                  const formattedX = isValueInteger ? Math.trunc(x) : x;

                  return formatNumber(
                    formattedX,
                    compact ? "compact" : undefined,
                    numberFormatOpts
                  );
                })}
              </animated.div>
            ) : (
              0
            )}
          </MetricLayout>
          <div className="absolute flex items-end gap-1">
            {/* Render an invisible component that fills the maximum space the metric value is going
            to take up to prevent the metric unit from jumping around when the metric value animation
            is running
            */}
            <div className="invisible">
              <MetricLayout compact={compact} isSecondary={isSecondary}>
                {createPlaceholder(formattedNumber)}
              </MetricLayout>
            </div>
            <div
              className={cn(
                "relative left-0.5 text-xs font-semibold text-contentSecondary-light dark:text-contentSecondary-dark md:left-0",
                { " sm:text-xs": compact },
                { " sm:text-sm": !compact },
                { "bottom-1": !isSecondary },
                { "bottom-0.5 text-xs": isSecondary }
              )}
            >
              {unit}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="block sm:hidden">
            <Skeleton height={compact ? 20 : 30} width={80} />
          </div>
          <div className="hidden sm:block">
            <Skeleton height={compact ? 20 : 40} width={compact ? 100 : 120} />
          </div>
        </>
      )}
    </div>
  );
}

export const MetricCard: FC<MetricCardProps> = function ({
  name,
  compact = false,
  metric,
  secondaryMetric,
}) {
  return (
    <Card compact={compact}>
      <div
        className={cn(
          {
            "sm:gap-4": !compact,
            "sm:gap-1": compact,
          },
          "flex flex-col justify-between gap-1"
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
        <div>
          <Metric {...(metric || {})} compact={compact} />
          {secondaryMetric && (
            <Metric {...secondaryMetric} compact={compact} isSecondary />
          )}
        </div>
      </div>
    </Card>
  );
};
