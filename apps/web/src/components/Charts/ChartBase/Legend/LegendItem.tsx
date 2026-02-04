import type { FC, KeyboardEventHandler, MouseEventHandler } from "react";
import cn from "classnames";

import { formatSeriesName } from "../helpers";

export interface LegendItemProps {
  name: string;
  color?: string;
  isDisabled?: boolean;
  isSelected?: boolean;
  isBlurred?: boolean;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: MouseEventHandler<HTMLDivElement>;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
}

const LegendDot: FC<{ color?: string; isDisabled?: boolean }> = function ({
  color,
  isDisabled,
}) {
  return (
    <div
      className="h-2 w-2 rounded border"
      style={{
        borderColor: color,
        ...(isDisabled ? {} : { backgroundColor: color }),
      }}
    />
  );
};

export const LegendItem: FC<LegendItemProps> = function ({
  name,
  color,
  isDisabled,
  isSelected,
  isBlurred,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onKeyDown,
}) {
  const formattedName = formatSeriesName(name);

  return (
    <div
      key={name}
      className={cn(
        {
          "opacity-100": isSelected || !isBlurred,
        },
        {
          "opacity-50": !isSelected && isBlurred,
        },

        { "text-[#505050]": isDisabled },
        "cursor flex w-full items-center gap-1 break-normal text-xs opacity-100 transition-opacity"
      )}
      role="button"
      tabIndex={0}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {name !== "All" && <LegendDot color={color} isDisabled={isDisabled} />}
      <div
        title={formattedName}
        className="w-full whitespace-nowrap md:truncate"
      >
        {formattedName}
      </div>
    </div>
  );
};

export const LegendSkeletonItem: FC = function () {
  return (
    <div className="flex h-3 w-[100px] animate-pulse items-center gap-1">
      <LegendDot color="#e5e7eb52" />
      <div className="h-3 w-[50px] rounded-sm bg-[#434672]" />
    </div>
  );
};
