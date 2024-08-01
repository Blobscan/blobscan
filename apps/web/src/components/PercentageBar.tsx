import type { FC, HTMLAttributes } from "react";
import { animated, useSpring } from "@react-spring/web";

export type PercentageBarProps = {
  className?: HTMLAttributes<HTMLDivElement>["className"];
  percentage: number;
  compact?: boolean;
};

export const PercentageBar: FC<PercentageBarProps> = function ({
  percentage,
  className,
  compact = false,
}) {
  const percentageProps = useSpring({
    value: percentage * (compact ? 48 : 96),
    from: { value: 0 },
    cancel: !percentage,
  });

  return (
    <div className="relative">
      <div
        className={`${
          compact ? "w-12" : "w-24"
        } h-1.5 rounded-md bg-primary-200 dark:bg-primary-800`}
      />
      <animated.div
        className={`absolute top-0 h-1.5 rounded-md ${className}`}
        style={{
          width: percentageProps.value.to((x) => `${x}px`),
        }}
      />
    </div>
  );
};
