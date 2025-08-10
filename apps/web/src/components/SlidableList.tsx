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
  const [items, setItems] = useState<(ListItem & { index: number })[]>([]);

  const transitions = useTransition(items, {
    keys: (item) => item.id,
    onStart() {
      if (items.length > maxItems) {
        setItems((currentItems) => currentItems.slice(0, maxItems));
      }
    },
    from: (item) => ({
      opacity: 0,
      height: 0,
      marginTop: 0,
      transform: `translateY(-${(items.length - 1 - item.index) * 150}px)`,
    }),
    enter: (item) => (next) =>
      next({
        opacity: 1,
        height: refMap.get(item)?.offsetHeight ?? 0,
        transform: "translateY(0px)",
        marginTop: 15,
        delay: (items.length - 1 - item.index) * 200,
      }),
    leave: (item) => ({
      height: 0,
      opacity: 0,
      transform: `translateY(${(items.length - item.index) * 150}px)`,
      delay: (items.length - 1 - item.index) * 200,
    }),
    config: {
      duration: 450,
    },
  });

  useEffect(() => {
    if (!itemsProp?.length) {
      return;
    }

    setItems((currentItems) => {
      const newItems = itemsProp
        .filter(({ id }) => !currentItems.some((item) => item.id === id))
        .map(({ element, id }, i) => ({ element, id, index: i }));

      return newItems.length ? [...newItems, ...currentItems] : currentItems;
    });
  }, [itemsProp]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {transitions((style, item) => (
        <animated.div
          style={{
            position: "relative",
            ...style,
          }}
        >
          <div
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
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
