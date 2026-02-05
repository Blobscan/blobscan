import type { FC } from "react";
import React, { useCallback, useRef } from "react";
import cn from "classnames";

import { Scrollable } from "~/components/Scrollable";
import { LegendItem, LegendSkeletonItem } from "./LegendItem";

export type LegendProps = {
  items: LegendItemData[];
  selectedItem?: string;
  isLoading?: boolean;
  skeletonOpts?: {
    itemCount?: number;
  };
  onItemToggle?: (itemName: string | "all", disabled: boolean) => void;
  onItemHover?: (itemName: string, direction: "in" | "out") => void;
};

export type LegendItemData = {
  name: string;
  color?: string;
  disabled: boolean;
};

const DEFAULT_SKELETON_ITEM_COUNT = 24;

export const Legend: FC<LegendProps> = function ({
  items,
  selectedItem,
  isLoading,
  skeletonOpts,
  onItemHover,
  onItemToggle,
}) {
  const legendRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(
    ({ name, disabled: itemDisabled }: LegendItemData) => {
      const itemName = name === "All" ? "all" : name;

      onItemToggle?.(itemName, !itemDisabled);
    },
    [onItemToggle]
  );

  return (
    <div
      ref={legendRef}
      className={cn(
        "flex h-full w-full gap-2 truncate",
        "md:w-20 md:flex-col md:items-start md:gap-0",
        { "justify-center": items.length <= 15 }
      )}
    >
      {!isLoading ? (
        <Scrollable>
          <div className="flex items-center gap-1 md:flex-col">
            {items?.map((item) => {
              const { color, disabled, name } = item;

              return (
                <LegendItem
                  key={name}
                  name={name}
                  color={color}
                  isDisabled={disabled}
                  isSelected={selectedItem === name}
                  isBlurred={!!selectedItem}
                  onClick={() => handleToggle(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleToggle(item);
                    }
                  }}
                  onMouseEnter={() => onItemHover?.(name, "in")}
                  onMouseLeave={() => onItemHover?.(name, "out")}
                />
              );
            })}
          </div>
        </Scrollable>
      ) : (
        <div className="flex items-center justify-center gap-2 md:flex-col">
          {Array.from(
            { length: skeletonOpts?.itemCount ?? DEFAULT_SKELETON_ITEM_COUNT },
            (_, i) => i
          ).map((_, i) => (
            <LegendSkeletonItem key={i} />
          ))}
        </div>
      )}
    </div>
  );
};
