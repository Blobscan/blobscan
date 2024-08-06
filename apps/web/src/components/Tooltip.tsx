import type { ReactNode } from "react";

export function Tooltip({
  show,
  children,
}: {
  show: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`pointer-events-none absolute -top-2 left-[50%] z-10 -translate-x-[50%] translate-y-[-100%] ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="rounded-full bg-accent-light px-3 py-1.5 text-xs text-white dark:bg-primary-500">
        {children}
      </div>
      <div className="absolute bottom-0 left-[50%] h-2 w-2 -translate-x-[50%] translate-y-[50%] rotate-45 bg-accent-light dark:bg-primary-500" />
    </div>
  );
}
