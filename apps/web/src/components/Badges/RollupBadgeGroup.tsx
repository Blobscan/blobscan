import { useState } from "react";
import type { CSSProperties } from "react";
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  safePolygon,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";

import { ROLLUP_DEFINITIONS } from "@blobscan/rollups";

import type { Rollup } from "~/types";
import { RollupBadge } from "./RollupBadge";
import styles from "./RollupBadgeGroup.module.css";

export function RollupBadgeGroup({
  amounts,
}: {
  amounts: Partial<Record<Rollup, number>>;
}) {
  const entries = Object.entries(amounts);
  const visibleEntries = entries.slice(0, 4);
  const remainingCount = entries.length - visibleEntries.length;
  const overflowWidth = Math.max(20, `${remainingCount}`.length * 6 + 14);
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom-end",
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });
  const hover = useHover(context, { handleClose: safePolygon() });
  const focus = useFocus(context);
  const click = useClick(context, { toggle: false });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    click,
    dismiss,
    role,
  ]);

  if (!entries.length) {
    return null;
  }

  return (
    <div
      className={`${styles.group} before:bg-surface-light dark:before:bg-surface-dark`}
      style={
        {
          "--visible-count": visibleEntries.length,
          "--overflow-width": remainingCount > 0 ? `${overflowWidth}px` : "0px",
          "--overflow-gap": remainingCount > 0 ? "2px" : "0px",
        } as CSSProperties
      }
      tabIndex={entries.length > 1 ? 0 : undefined}
      role="group"
      aria-label="Rollup transaction counts"
    >
      {visibleEntries.map(([rollup, amount], index) => (
        <div
          key={rollup}
          className={styles.item}
          style={{ zIndex: entries.length - index }}
        >
          <RollupBadge rollup={rollup as Rollup} amount={amount} compact />
        </div>
      ))}
      {remainingCount > 0 && (
        <button
          ref={refs.setReference}
          type="button"
          className="relative z-10 ml-0.5 flex h-5 shrink-0 items-center justify-center rounded-full bg-slate-200 px-1 text-[10px] font-semibold text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 dark:bg-slate-700 dark:text-slate-100"
          style={{ width: overflowWidth }}
          aria-label={`Show all ${entries.length} rollups; ${remainingCount} more rollups`}
          {...getReferenceProps({
            onClick: (event) => event.stopPropagation(),
          })}
        >
          +{remainingCount}
        </button>
      )}
      {remainingCount > 0 && isOpen && (
        <FloatingPortal>
          <FloatingFocusManager
            context={context}
            modal={false}
            initialFocus={-1}
          >
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className="z-50 w-64 max-w-[calc(100vw-16px)] rounded-lg border border-slate-200 bg-white p-3 text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              aria-label="All rollups and transaction counts"
              {...getFloatingProps()}
            >
              <div className="mb-2 text-xs font-semibold">
                All rollups · Transactions
              </div>
              {/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Keyboard users must be able to scroll this region. */}
              <div
                className="max-h-64 overflow-y-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                role="group"
                tabIndex={0}
                aria-label="Rollup transaction counts"
              >
                <ul className="space-y-2">
                  {entries.map(([rollup, amount]) => (
                    <li
                      key={rollup}
                      className="flex items-center gap-2 text-xs"
                    >
                      <RollupBadge rollup={rollup as Rollup} compact />
                      <span className="min-w-0 flex-1">
                        {ROLLUP_DEFINITIONS[rollup as Rollup].name}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {amount}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* eslint-enable jsx-a11y/no-noninteractive-tabindex */}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </div>
  );
}
