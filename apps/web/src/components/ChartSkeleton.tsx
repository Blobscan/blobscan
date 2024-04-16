import type { FC } from "react";
import { a, config, useTrail } from "@react-spring/web";

import { Skeleton } from "./Skeleton";

export type ChartSkeletonProps = {
  itemsCount: number;
};

export const ChartSkeleton: FC<ChartSkeletonProps> = function ({ itemsCount }) {
  const trails = useTrail(itemsCount, {
    from: { opacity: 0, height: 0 },
    to: { opacity: 1, height: 1 },
    config: config.gentle,
    loop: true,
  });

  return (
    <div className="flex h-28 items-end justify-center gap-1 overflow-hidden">
      {trails.map((styles, index) => (
        <a.div
          key={index}
          style={{
            ...styles,
            height: styles.height.to(
              (value) => `${value * ((index + 1) * 13)}%`
            ),
          }}
        >
          <Skeleton width={20} height="100%" />
        </a.div>
      ))}
    </div>
  );
};
