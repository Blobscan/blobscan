import type { FC } from "react";
import { animated, useSpring } from "@react-spring/web";
import cn from "classnames";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { convertWei } from "@blobscan/eth-units";

import { formatBytes, formatNumber } from "~/utils";
import { Card } from "./Card";

export type MetricType = "standard" | "bytes" | "ethereum" | "percentage";

export type MetricProp = {
  value?: bigint | number;
  numberFormatOpts?: Intl.NumberFormatOptions;
  type?: MetricType;
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

/**
 *  Creates a placeholder string that takes up the maximum amount of space the input could take with
 *  that amount of characters
 */
function createPlaceholder(input: string): string {
  /**
   * We replace all numeric characters with '8' because it takes up the most pixels compared to
   * other numbers
   */
  const replacedString = input.replace(/[0-9]/g, "8");
  return replacedString;
}

function formatMetric(
  value: number | bigint,
  {
    type,
    compact,
    numberFormatOpts,
  }: {
    type: MetricType;
    compact?: boolean;
    numberFormatOpts?: Intl.NumberFormatOptions;
  } = {
    type: "standard",
    compact: false,
  }
) {
  const isHugeNumber = value > 1e9;
  const inputMode = compact ? "compact" : "standard";
  const mode = isHugeNumber ? "compact" : inputMode;
  let formattedValue: string;

  switch (type) {
    case "bytes":
      formattedValue = formatBytes(value);
      break;
    case "ethereum":
      if (typeof value == "number") {
        value = BigInt(Math.round(value));
      }

      const gwei = convertWei(value, "Gwei");
      formattedValue = formatNumber(gwei, "compact") + " Gwei";
      break;
    case "percentage":
      formattedValue = `${formatNumber(value, mode, {
        maximumFractionDigits: 2,
        ...numberFormatOpts,
      })} %`;
      break;
    default:
      formattedValue = formatNumber(value, mode, {
        maximumSignificantDigits: 9,
        ...numberFormatOpts,
      });
      break;
  }

  const [value_ = "0", unit = ""] = formattedValue.split(" ");

  return {
    value: value_,
    unit,
  };
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

function Metric({
  value,
  numberFormatOpts,
  type = "standard",
  compact,
  isSecondary = false,
}: MetricProp & { compact?: boolean; isSecondary?: boolean }) {
  const isValueInteger = value && isInteger(value);
  const valueProps = useSpring({
    value: Number(value),
    from: { value: 0 },
    cancel: !value,
  });
  const isValueSet = value !== undefined;
  const formattedMetric = isValueSet
    ? formatMetric(value, { type, compact, numberFormatOpts })
    : undefined;

  return (
    <div>
      {isValueSet ? (
        <div className="flex gap-2 dark:text-warmGray-50">
          <MetricLayout compact={compact} isSecondary={isSecondary}>
            {isValueSet ? (
              <animated.div>
                {valueProps.value.to((x) => {
                  const x_ = isValueInteger ? Math.trunc(x) : x;
                  const { value: formattedX } = formatMetric(x_, {
                    type,
                    compact,
                    numberFormatOpts,
                  });

                  return formattedX;
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
                {createPlaceholder(formattedMetric?.value ?? "")}
              </MetricLayout>
            </div>
            <div
              className={cn(
                "relative left-0.5 text-xs text-contentSecondary-light dark:text-contentSecondary-dark md:left-0",
                { " sm:text-xs": compact },
                { " sm:text-sm": !compact },
                { "bottom-1": !isSecondary },
                { "bottom-0.5 text-xs": isSecondary }
              )}
            >
              {formattedMetric?.unit}
            </div>
          </div>
        </div>
      ) : (
        <Skeleton height={20} width="60%" />
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
          className={cn("text-sm", "font-semibold dark:text-warmGray-50", {
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
