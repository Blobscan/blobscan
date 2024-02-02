import type { FC, HTMLAttributes } from "react";
import { animated, useSpring } from "@react-spring/web";

export type PercentageBarProps = {
  className?: HTMLAttributes<HTMLDivElement>["className"];
  percentage: number;
};

export const PercentageBar: FC<PercentageBarProps> = function ({
  percentage,
  className,
}) {
  const percentageProps = useSpring({
    value: percentage * 96,
    from: { value: 0 },
    cancel: !percentage,
  });

  return (
    <div className="relative">
      <div className="h-1.5 w-24 rounded-md bg-primary-200 dark:bg-primary-800" />
      <animated.div
        className={`absolute top-0 h-1.5 rounded-md ${className}`}
        style={{
          width: percentageProps.value.to((x) => `${x}px`),
        }}
      />
    </div>
  );
};
