import { useEffect, useMemo, useState } from "react";
import type { FC, ReactNode } from "react";
import { animated, useTransition } from "@react-spring/web";

const DEFAULT_MAX_ITEMS = 5;

type ListItem = {
  id: number | string;
  element: ReactNode;
};

export type SlidableListProps = {
  items: ListItem[];
  maxItems?: number;
};

export const SlidableList: FC<SlidableListProps> = function ({
  items: itemsProp,
  maxItems = DEFAULT_MAX_ITEMS,
}) {
  const refMap = useMemo(() => new WeakMap(), []);
  const [items, setItems] = useState<ListItem[]>([]);

  const transitions = useTransition(items, {
    keys: (item) => item.id,
    from: { opacity: 0, height: 0 },
    enter: (item) => async (next) => {
      await next({ opacity: 1, height: refMap.get(item).offsetHeight });
    },
    leave: [{ opacity: 0 }, { height: 0 }],
    config: { tension: 160, friction: 20 },
    onStart: () => {
      // Remove oldest items if the list exceeds the maxItems limit
      if (items.length > maxItems) {
        setItems((currentItems) => currentItems.slice(0, maxItems));
      }
    },
  });

  useEffect(() => {
    if (!itemsProp?.length) {
      return;
    }

    setItems((currentItems) => {
      const newItems = itemsProp
        .filter(({ id }) => !currentItems.some((item) => item.id === id))
        .map(({ element, id }) => ({ element, id }));

      return newItems.length ? [...newItems, ...currentItems] : currentItems;
    });
  }, [itemsProp]);

  return (
    <div className="relative flex h-full w-full flex-col gap-3 overflow-hidden">
      {transitions((style, item) => (
        <animated.div
          style={{
            position: "relative",
            ...style,
          }}
        >
          <div
            ref={(ref: HTMLDivElement) => ref && refMap.set(item, ref)}
            key={item.id}
          >
            {item.element}
          </div>
        </animated.div>
      ))}
    </div>
  );
};
