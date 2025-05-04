import React, { useCallback, useRef } from "react";
import cn from "classnames";

import { Scrollable } from "~/components/Scrollable";
import { formatSeriesName } from "./helpers";

export type LegendProps = {
  items: LegendItem[];
  selectedItem?: string;
  onItemToggle?: (itemName: string | "all", disabled: boolean) => void;
  onItemHover?: (itemName: string, direction: "in" | "out") => void;
};

export type LegendItem = {
  name: string;
  color?: string;
  disabled: boolean;
};

export const Legend: React.FC<LegendProps> = function ({
  items,
  selectedItem,
  onItemHover,
  onItemToggle,
}) {
  const legendRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(
    ({ name, disabled: itemDisabled }: LegendItem) => {
      const itemName = name === "All" ? "all" : name;

      onItemToggle?.(itemName, !itemDisabled);
    },
    [onItemToggle]
  );

  return (
    <div
      ref={legendRef}
      className={cn(
        "flex h-full w-full cursor-pointer gap-2 truncate",
        "md:w-20 md:flex-col md:items-start md:gap-0",
        { "justify-center": items.length <= 15 }
      )}
    >
      <Scrollable>
        <div className="flex items-center md:flex-col">
          {items?.map((item, i) => {
            const { color, disabled, name } = item;
            const formattedName = formatSeriesName(name);

            return (
              <div
                key={`${name}-${i}`}
                className={cn(
                  {
                    "opacity-100": selectedItem === name || !selectedItem,
                  },
                  {
                    "opacity-50": selectedItem !== name && !!selectedItem,
                  },

                  { "text-[#505050]": disabled },
                  "cursor flex w-full items-center gap-1 break-normal text-xs opacity-100 transition-opacity"
                )}
                role="button"
                tabIndex={0}
                onMouseEnter={() => onItemHover?.(name, "in")}
                onMouseLeave={() => onItemHover?.(name, "out")}
                onClick={() => handleToggle(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleToggle(item);
                  }
                }}
              >
                {name !== "All" && (
                  <div
                    className="h-[8px] w-[8px] rounded border"
                    style={{
                      borderColor: color,
                      ...(disabled ? {} : { backgroundColor: color }),
                    }}
                  />
                )}
                <div
                  title={formattedName}
                  className="w-full whitespace-nowrap md:truncate"
                >
                  {formattedName}
                </div>
              </div>
            );
          })}
        </div>
      </Scrollable>
    </div>
  );
};
