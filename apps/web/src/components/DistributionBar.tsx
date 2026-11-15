import { animated } from "@react-spring/web";
import cn from "classnames";

import { useAnimatedPercentage } from "~/hooks/useAnimatedPercentage";
import type { Numerish } from "~/utils";

export type DistributionSegment = {
  id: string;
  label: string;
  value: Numerish;
  color: string;
};

function Segment({
  segment,
  total,
  onActiveSegmentChange,
}: {
  segment: DistributionSegment;
  total: bigint;
  onActiveSegmentChange?: (id: string | null) => void;
}) {
  const animation = useAnimatedPercentage(toUnits(segment.value), total);
  const props = {
    className: `h-full shrink-0 ${segment.color}`,
    style: { width: animation.value.to((value) => `${value * 100}%`) },
    "aria-label": segment.label,
  };
  return onActiveSegmentChange ? (
    <animated.button
      {...props}
      type="button"
      onMouseEnter={() => onActiveSegmentChange(segment.id)}
      onMouseLeave={() => onActiveSegmentChange(null)}
      onFocus={() => onActiveSegmentChange(segment.id)}
      onBlur={() => onActiveSegmentChange(null)}
    />
  ) : (
    <animated.div {...props} />
  );
}

function toUnits(value: Numerish): bigint {
  if (typeof value === "bigint") return value > 0n ? value * 1000000n : 0n;
  if (typeof value === "string" && /^\d+$/.test(value))
    return BigInt(value) * 1000000n;
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? BigInt(Math.round(number * 1000000))
    : 0n;
}

export function DistributionBar({
  segments,
  label,
  compact = false,
  onActiveSegmentChange,
}: {
  segments: DistributionSegment[];
  label: string;
  compact?: boolean;
  onActiveSegmentChange?: (id: string | null) => void;
}) {
  const total = segments.reduce(
    (sum, segment) => sum + toUnits(segment.value),
    0n
  );
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex w-full overflow-hidden rounded-md bg-primary-200 dark:bg-primary-800",
        compact ? "h-0.5" : "h-1"
      )}
    >
      {segments.map((segment) => (
        <Segment
          key={segment.id}
          segment={segment}
          total={total}
          onActiveSegmentChange={onActiveSegmentChange}
        />
      ))}
    </div>
  );
}
