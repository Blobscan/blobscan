import type { CSSProperties, ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Tab, TabGroup, TabList } from "@headlessui/react";
import cn from "classnames";

import type { RenderableIcon } from "~/types/icons";
import { Icon } from "./Icon";

// useLayoutEffect gives a warning on the server. The block is measured only
// in the browser.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type TabItem<T extends string> = {
  value: T;
  label: ReactNode;
  icon?: RenderableIcon;
  /** A small value next to the label, for example a count. */
  badge?: ReactNode;
  content: ReactNode;
};

export type TabsProps<T extends string> = {
  tabs: TabItem<T>[];
  selected: T;
  onChange: (value: T) => void;
  /** Makes the bar use the full width, with tabs of equal width. */
  fullWidth?: boolean;
};

type IndicatorPosition = { left: number; width: number };

/** The edges of the tab row with more tabs past them. */
type Fades = { start: boolean; end: boolean };

// The width of the fade at an edge.
const FADE_WIDTH = "2rem";

function getFadeMaskStyle({ start, end }: Fades): CSSProperties | undefined {
  if (!start && !end) {
    return;
  }

  const mask = `linear-gradient(to right, ${
    start ? `transparent, black ${FADE_WIDTH}` : "black"
  }, ${end ? `black calc(100% - ${FADE_WIDTH}), transparent` : "black"})`;

  return { maskImage: mask, WebkitMaskImage: mask };
}

// The time of each fade: the old content fades out, then the new content
// fades in.
const FADE_MS = 150;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Tabs with a segmented control and one panel for each tab. The bar has the
 * style of the cards of the app. A block marks the selected tab, and it
 * slides to a tab when the user selects it, and the content fades out and
 * in. The parent keeps the selected tab, for example in the URL.
 */
export function Tabs<T extends string>({
  tabs,
  selected,
  onChange,
  fullWidth = false,
}: TabsProps<T>) {
  const selectedIndex = Math.max(
    tabs.findIndex((t) => t.value === selected),
    0
  );
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState<IndicatorPosition>();
  const [fades, setFades] = useState<Fades>({ start: false, end: false });
  const updateFades = useCallback(() => {
    const list = listRef.current;

    if (!list) {
      return;
    }

    // 1 pixel of margin: the scroll position can have a fraction.
    const start = list.scrollLeft > 1;
    const end = list.scrollLeft + list.clientWidth < list.scrollWidth - 1;

    setFades((prev) =>
      prev.start === start && prev.end === end ? prev : { start, end }
    );
  }, []);
  // The first position must not animate: the block appears on the selected
  // tab, and it slides only on the next changes.
  const [canAnimate, setCanAnimate] = useState(false);
  // The panel shows this tab. It changes after the fade-out.
  const [shownIndex, setShownIndex] = useState(selectedIndex);
  const [isFadingOut, setIsFadingOut] = useState(false);
  // Only a selection by the user fades. A change from the parent, for
  // example when the URL loads, shows the new content immediately.
  const isUserChangeRef = useRef(false);
  const baseId = useId();
  const getTabId = (value: T) => `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel`;

  useIsomorphicLayoutEffect(() => {
    const update = () => {
      const tab = tabRefs.current[selectedIndex];

      if (tab) {
        setIndicator({ left: tab.offsetLeft, width: tab.offsetWidth });
      }

      updateFades();
    };

    update();

    // The width of a tab changes, for example, when its badge loads or the
    // screen gets narrower.
    const observer = new ResizeObserver(update);

    if (listRef.current) {
      observer.observe(listRef.current);
    }

    tabRefs.current.forEach((tab) => tab && observer.observe(tab));

    // Headless UI does not pass onScroll to the element.
    const list = listRef.current;

    list?.addEventListener("scroll", updateFades, { passive: true });

    return () => {
      observer.disconnect();
      list?.removeEventListener("scroll", updateFades);
    };
  }, [selectedIndex, tabs.length, updateFades]);

  // When the bar scrolls, show all of the selected tab. Only the bar
  // scrolls: scrollIntoView can also scroll the page.
  useEffect(() => {
    const list = listRef.current;
    const tab = tabRefs.current[selectedIndex];

    if (!list || !tab || list.scrollWidth <= list.clientWidth) {
      return;
    }

    const tabStart = tab.offsetLeft;
    const tabEnd = tabStart + tab.offsetWidth;
    const behavior = canAnimate && !prefersReducedMotion() ? "smooth" : "auto";

    if (tabStart < list.scrollLeft) {
      list.scrollTo({ left: tabStart, behavior });
    } else if (tabEnd > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: tabEnd - list.clientWidth, behavior });
    }
  }, [selectedIndex, canAnimate]);

  useEffect(() => {
    if (indicator && !canAnimate) {
      const frame = requestAnimationFrame(() => setCanAnimate(true));

      return () => cancelAnimationFrame(frame);
    }
  }, [indicator, canAnimate]);

  useEffect(() => {
    if (selectedIndex === shownIndex) {
      setIsFadingOut(false);

      return;
    }

    if (!isUserChangeRef.current || prefersReducedMotion()) {
      setShownIndex(selectedIndex);

      return;
    }

    isUserChangeRef.current = false;
    setIsFadingOut(true);

    const timeout = setTimeout(() => {
      setShownIndex(selectedIndex);
      setIsFadingOut(false);
    }, FADE_MS);

    return () => clearTimeout(timeout);
  }, [selectedIndex, shownIndex]);

  const shownTab = tabs[shownIndex] ?? tabs[selectedIndex];

  return (
    <TabGroup
      selectedIndex={selectedIndex}
      onChange={(index) => {
        const tab = tabs[index];

        if (tab) {
          isUserChangeRef.current = true;
          onChange(tab.value);
        }
      }}
      className="flex flex-col gap-6"
    >
      {/* The bar has the style of the Card component. */}
      <div
        className={cn(
          "w-full rounded-lg border-surface-light bg-surface-light p-1.5 dark:border-surface-dark dark:bg-surface-dark",
          { "sm:w-fit": !fullWidth }
        )}
      >
        <TabList
          ref={listRef}
          className={cn(
            "relative flex h-9 w-full gap-1",
            // On a narrow screen, the tabs do not fit. The tabs scroll, not the
            // page, and they have no scrollbar.
            "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
          // An edge fades out when more tabs are past it.
          style={getFadeMaskStyle(fades)}
        >
          {indicator && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-y-0 left-0 rounded-md bg-primary-300/40 dark:bg-primary-600/30",
                {
                  "transition-[transform,width] duration-300 ease-out motion-reduce:transition-none":
                    canAnimate,
                }
              )}
              style={{
                width: indicator.width,
                transform: `translateX(${indicator.left}px)`,
              }}
            />
          )}
          {tabs.map(({ value, label, icon, badge }, i) => (
            <Tab
              key={value}
              id={getTabId(value)}
              ref={(el: HTMLButtonElement | null) => {
                tabRefs.current[i] = el;
                // Headless UI sets aria-controls only for its own panels, and
                // it ignores the prop. Set it on the element.
                el?.setAttribute("aria-controls", panelId);
              }}
              className={cn(
                "group relative flex flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition-colors",
                { "sm:flex-none": !fullWidth },
                // The same text color as the items of the navigation menu.
                "text-content-light dark:text-content-dark",
                "focus:outline-none data-[focus]:ring-2 data-[focus]:ring-indigo-500",
                "data-[hover]:text-iconHighlight-light dark:data-[hover]:text-iconHighlight-dark",
                "data-[selected]:text-accent-light dark:data-[selected]:text-accent-dark",
                // Before the first measure, the tab has the background itself.
                {
                  "data-[selected]:bg-primary-300/40 dark:data-[selected]:bg-primary-600/30":
                    !indicator,
                }
              )}
            >
              {icon && (
                // The icon has the color of the label, also on hover and
                // when the tab is selected.
                <Icon src={icon} className="transition-colors" />
              )}
              {label}
              {badge !== undefined && badge !== null && (
                <span className="rounded-full bg-primary-200 px-2 py-0.5 text-xs font-medium tabular-nums text-primary-700 transition-colors group-data-[selected]:bg-accent-light group-data-[selected]:text-accentContent-light dark:bg-primary-800 dark:text-primary-300 dark:group-data-[selected]:bg-accent-dark dark:group-data-[selected]:text-accentContent-dark">
                  {badge}
                </span>
              )}
            </Tab>
          ))}
        </TabList>
      </div>
      {/* One panel for the shown tab. Headless UI panels unmount the old
          content at once, so they cannot fade it out. */}
      {shownTab && (
        <div
          role="tabpanel"
          id={panelId}
          aria-labelledby={getTabId(shownTab.value)}
          tabIndex={0}
          className={cn(
            "transition-opacity ease-out focus:outline-none motion-reduce:transition-none",
            isFadingOut ? "opacity-0" : "opacity-100"
          )}
          style={{ transitionDuration: `${FADE_MS}ms` }}
        >
          {shownTab.content}
        </div>
      )}
    </TabGroup>
  );
}
