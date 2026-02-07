import type { FC } from "react";
import React, { useCallback, useEffect, useRef } from "react";
import cn from "classnames";

import { Scrollable } from "~/components/Scrollable";
import { useDebounce } from "~/hooks/useDebounce";
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

const DEFAULT_SKELETON_ITEM_COUNT = 28;

export const Legend: FC<LegendProps> = function ({
  items,
  selectedItem,
  isLoading,
  skeletonOpts,
  onItemHover,
  onItemToggle,
}) {
  const legendRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const legendItemsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const { value: debouncedSelectedItem, isDebouncing } = useDebounce(
    selectedItem,
    200
  );

  const handleToggle = useCallback(
    ({ name, disabled: itemDisabled }: LegendItemData) => {
      const itemName = name === "All" ? "all" : name;

      onItemToggle?.(itemName, !itemDisabled);
    },
    [onItemToggle]
  );

  useEffect(() => {
    if (isDebouncing || !debouncedSelectedItem) return;

    const container = scrollRef.current;
    const itemEl = legendItemsRef.current.get(debouncedSelectedItem);

    if (!container || !itemEl) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = itemEl.getBoundingClientRect();

    const itemTop = itemRect.top - containerRect.top + container.scrollTop;

    const isItemVisible =
      itemTop >= container.scrollTop &&
      itemTop + itemEl.clientHeight <=
        container.scrollTop + container.clientHeight;

    if (isItemVisible) return;

    const target =
      itemTop - container.clientHeight / 2 + itemEl.clientHeight / 2;

    container.scrollTo({
      top: Math.max(0, target),
      behavior: "smooth",
    });
  }, [debouncedSelectedItem, isDebouncing]);

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
        <Scrollable ref={scrollRef}>
          <div className="relative flex items-center gap-1 md:flex-col">
            {items?.map((item) => {
              const { color, disabled, name } = item;

              return (
                <div
                  key={name}
                  className="h-full w-full"
                  ref={(el) => {
                    if (!el) {
                      return;
                    }

                    legendItemsRef.current.set(name, el);
                  }}
                >
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
                </div>
              );
            })}
          </div>
        </Scrollable>
      ) : (
        <div className="flex h-full items-center justify-center gap-2 md:flex-col">
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
