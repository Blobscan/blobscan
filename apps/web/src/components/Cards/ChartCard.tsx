import { type FC, type ReactNode } from "react";
import cn from "classnames";

import { Card, CardHeader } from "./Card";
import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

type ChartCardProps = Partial<{
  title: ReactNode;
  children: React.ReactNode;
  size: "sm" | "md" | "lg";
  isEmptyChart?: boolean;
}>;

const ChartSkeleton: FC = function () {
  return (
    <div className="flex items-end gap-1">
      <Skeleton width={20} height={20} />
      <Skeleton width={20} height={50} />
      <Skeleton width={20} height={70} />
      <Skeleton width={20} height={40} />
      <Skeleton width={20} height={80} />
      <Skeleton width={20} height={60} />
      <Skeleton width={20} height={100} />
    </div>
  );
};

export const ChartCard: FC<ChartCardProps> = function ({
  children,
  title,
  size = "md",
  isEmptyChart,
}) {
  return (
    <Card compact>
      <div className="flex h-full flex-col gap-2">
        <div
          className={cn({
            "h-48 md:h-60 lg:h-48": size === "sm",
            "h-48 md:h-64 lg:h-80": size === "md",
            "h-48 md:h-64 lg:h-96": size === "lg",
          })}
        >
          {isEmptyChart ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-sm font-thin uppercase text-contentSecondary-light dark:text-contentSecondary-dark">
                No data
              </div>
            </div>
          ) : (
            children ?? (
              <div className="flex h-full w-full items-center justify-center">
                <ChartSkeleton />
              </div>
            )
          )}
        </div>

        <CardHeader inverse compact>
          <div className="flex justify-center text-sm">
            {title ?? <Skeleton width={150} />}
          </div>
        </CardHeader>
      </div>
    </Card>
  );
};
