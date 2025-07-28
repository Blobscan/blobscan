import type { FC } from "react";
import classNames from "classnames";

import { Separator } from "./Separator";
import { Skeleton } from "./Skeleton";

export type IndicatorProps = {
  name: string;
  value: React.ReactNode;
  secondaryValue?: React.ReactNode;
  icon?: React.ReactNode;
};

export function Indicator({
  name,
  value,
  secondaryValue,
  icon = null,
}: IndicatorProps) {
  return (
    <div className="relative flex items-center gap-1">
      {icon}
      <span className="text-nowrap text-xs text-contentSecondary-light dark:text-contentSecondary-dark">
        {name}:
      </span>
      {value !== undefined ? (
        <div className="flex items-center gap-1">
          <div className="text-nowrap text-content-light dark:text-content-dark">
            {value}
          </div>
          {secondaryValue && (
            <div className="flex items-center gap-1 text-nowrap text-contentTertiary-light dark:text-contentTertiary-dark">
              <div className="opacity-30">|</div> {secondaryValue}
            </div>
          )}
        </div>
      ) : (
        <Skeleton width={75} />
      )}
    </div>
  );
}
