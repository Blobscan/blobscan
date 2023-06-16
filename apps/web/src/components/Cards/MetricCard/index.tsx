import { type FC } from "react";
import { animated, useSpring } from "@react-spring/web";

import { CardBase } from "../Bases";

export type MetricCardProps = {
  name: string;
  value?: number;
  unit?: string;
};
export const MetricCard: FC<MetricCardProps> = function ({
  name,
  value = 0,
  unit,
}) {
  const isInteger = Number.isInteger(value);
  const props = useSpring({ value: Number(value), from: { value: 0 } });

  return (
    <CardBase>
      <div className="flex items-center gap-4 pl-4">
        <div className="flex flex-col gap-4">
          <div className="font-semibold">{name}</div>
          <div className="flex gap-2 ">
            <div className="text-3xl font-semibold sm:text-4xl">
              {value ? (
                <animated.div>
                  {props.value.to((x) =>
                    (isInteger ? Math.trunc(x) : x.toFixed(2)).toLocaleString(),
                  )}
                </animated.div>
              ) : (
                0
              )}
            </div>
            {unit && (
              <div className="absolute flex items-end gap-3">
                <div className="invisible text-3xl sm:text-4xl">
                  {value.toLocaleString()}
                </div>
                <div className="relative bottom-0.5 font-semibold text-contentSecondary-light dark:text-contentSecondary-dark">
                  {unit}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CardBase>
  );
};
