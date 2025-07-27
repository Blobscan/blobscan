import type { FC } from "react";

import { Separator } from "./Separator";
import { Skeleton } from "./Skeleton";

export type IndicatorProps = {
  name: string;
  value: React.ReactNode;
  secondaryValue?: React.ReactNode;
  icon?: React.ReactNode;
};

function Indicator({
  name,
  value,
  secondaryValue,
  icon = null,
}: IndicatorProps) {
  return (
    <div className="relative flex items-center gap-1">
      {icon}
      <span className="text-nowrap">{name}:</span>
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

export const IndicatorsStrip: FC<{ indicators: IndicatorProps[] }> = function ({
  indicators,
}) {
  return (
    <div className="flex flex-col items-center justify-start gap-2 overflow-scroll align-middle text-xs text-contentSecondary-light dark:text-contentSecondary-dark sm:h-4 sm:overflow-auto md:flex-row">
      {indicators.map((props, i) => {
        return (
          <div
            key={props.name}
            className="flex flex-row flex-wrap items-center gap-2"
          >
            <Indicator {...props} />
            <span className="flex">
              {i < indicators.length - 1 ? <Separator /> : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
};
