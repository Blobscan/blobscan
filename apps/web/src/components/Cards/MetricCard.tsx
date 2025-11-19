import type { FC } from "react";
import { animated, useSpring } from "@react-spring/web";
import cn from "classnames";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { prettyFormatWei } from "@blobscan/eth-format";

import {
  formatBytes,
  formatNumber,
  parseDecimalNumber,
  parseSuffixedNumber,
} from "~/utils";
import { Card } from "./Card";

export type MetricType = "standard" | "bytes" | "ethereum" | "percentage";

type Metric = {
  value?: bigint | number;
  numberFormatOpts?: Intl.NumberFormatOptions;
  type?: MetricType;
};

export type MetricProp = {
  primary: Metric;
  secondary?: Metric;
};
export type MetricCardProps = Partial<{
  name: string;
  compact: boolean;
  metric: MetricProp;
}>;

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

function parseMetricValue(
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
      formattedValue = prettyFormatWei(value, {
        numberFormatOpts: { notation: "standard" },
      });
      break;
    case "percentage":
      formattedValue = `${formatNumber(value, mode, {
        maximumFractionDigits: 2,
        ...numberFormatOpts,
      })} %`;
      break;
    default:
      formattedValue = formatNumber(value, mode, {
        maximumSignificantDigits: compact ? 2 : undefined,
        ...numberFormatOpts,
      });
      break;
  }

  const [value_ = "0", unit = ""] = formattedValue.split(" ");
  const [numericPart, suffix] = parseSuffixedNumber(value_);
  const [integerPart, decimalPart] = parseDecimalNumber(
    numericPart ? numericPart.toString() : ""
  );

  return {
    value: value_,
    numericPart,
    integerPart,
    decimalPart,
    suffix,
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
          "text-lg sm:text-xl lg:text-sm xl:text-xl": compact,
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
  primary,
  secondary,
  compact,
}: MetricProp & { compact?: boolean }) {
  const hasSecondary = secondary !== undefined;
  const { value, numberFormatOpts, type = "standard" } = primary;
  const parsedMetric = parseMetricValue(value ?? 0, {
    type,
    compact,
    numberFormatOpts,
  });

  const isValueSet = value !== undefined;
  const valueProps = useSpring({
    value: parsedMetric.numericPart,
    from: { value: 0 },
    cancel: !isValueSet,
  });

  return (
    <div>
      {isValueSet ? (
        <div className="flex gap-2 dark:text-warmGray-50">
          <MetricLayout compact={compact}>
            {isValueSet ? (
              <animated.div>
                {valueProps.value.to((v) => {
                  const formattedValue = formatNumber(
                    v.toFixed(parsedMetric.decimalPart?.length ?? 0)
                  );
                  const suffix = parsedMetric.suffix ?? "";

                  return `${formattedValue}${suffix}`;
                })}
              </animated.div>
            ) : (
              0
            )}
          </MetricLayout>
          <div className="absolute flex items-end  gap-1">
            {/* Render an invisible component that fills the maximum space the metric value is going
            to take up to prevent the metric unit from jumping around when the metric value animation
            is running
            */}
            <div className="invisible">
              <MetricLayout compact={compact}>
                {createPlaceholder(parsedMetric.value ?? "")}
              </MetricLayout>
            </div>
            <div
              className={cn(
                "relative left-0.5 text-xs text-contentSecondary-light dark:text-contentSecondary-dark md:left-0",
                { " sm:text-xs": compact },
                { " sm:text-sm": !compact },
                { "bottom-1": !hasSecondary },
                { "bottom-0.5 text-xs": hasSecondary }
              )}
            >
              {parsedMetric?.unit}
            </div>
            {secondary && (
              <div className="relative bottom-1 text-xs text-contentTertiary-light dark:text-contentTertiary-dark">
                ({secondary.value}
                {secondary.type === "percentage" ? "%" : ""})
              </div>
            )}
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
}) {
  return (
    <Card compact={compact}>
      <div
        className={cn(
          {
            "sm:gap-2": !compact,
            "sm:gap-1": compact,
          },
          "flex flex-col justify-between gap-1",
          "relative overflow-hidden"
        )}
      >
        <div
          className={cn("text-sm", "font-semibold dark:text-warmGray-50", {
            "sm:text-sm": !compact,
          })}
        >
          {name ?? <Skeleton width={80} height={20} />}
        </div>
        {metric && <Metric {...(metric ?? {})} compact={compact} />}
      </div>
    </Card>
  );
};
