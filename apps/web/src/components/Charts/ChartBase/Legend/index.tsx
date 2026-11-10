import type { FC } from "react";
import React, { useCallback, useEffect, useRef } from "react";
import cn from "classnames";

import { Scrollable } from "~/components/Scrollable";
import { useDebounce } from "~/hooks/useDebounce";
import { LegendItem, LegendSkeletonItem } from "./LegendItem";

export type LegendPosition = "right" | "bottom";

export type LegendProps = {
  items: LegendItemData[];
  /**
   * "right": a column on the right of the chart on medium screens and up, and
   * a row below the chart on smaller screens. "bottom": a row below the chart
   * on all screens.
   */
  position?: LegendPosition;
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
  position = "right",
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
    150
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

    // A row scrolls on the horizontal axis.
    if (position === "bottom") {
      const itemLeft =
        itemRect.left - containerRect.left + container.scrollLeft;
      const isItemInView =
        itemLeft >= container.scrollLeft &&
        itemLeft + itemEl.clientWidth <=
          container.scrollLeft + container.clientWidth;

      if (!isItemInView) {
        container.scrollTo({
          left: Math.max(
            0,
            itemLeft - container.clientWidth / 2 + itemEl.clientWidth / 2
          ),
          behavior: "smooth",
        });
      }

      return;
    }

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
  }, [debouncedSelectedItem, isDebouncing, position]);

  return (
    <div
      ref={legendRef}
      className={cn(
        "flex h-full w-full gap-2 truncate",
        { "md:w-20 md:flex-col md:items-start md:gap-0": position === "right" },
        { "justify-center": items.length <= 15 }
      )}
    >
      {!isLoading ? (
        <Scrollable ref={scrollRef}>
          <div
            className={cn("relative flex items-center", {
              "gap-1 md:flex-col": position === "right",
              // Centered while the row fits. A longer row scrolls.
              "mx-auto w-max gap-4": position === "bottom",
            })}
          >
            {items?.map((item) => {
              const { color, disabled, name } = item;

              return (
                <div
                  key={name}
                  // In a row below the chart, the items keep their own width.
                  className={cn("h-full", { "w-full": position === "right" })}
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
        <div
          className={cn("flex h-full items-center justify-center gap-2", {
            "md:flex-col": position === "right",
          })}
        >
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
