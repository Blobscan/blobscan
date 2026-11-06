import { useState } from "react";
import type { ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import cn from "classnames";

type BannerVariant = "info" | "warning";

interface BannerProps {
  variant?: BannerVariant;
  dismissible?: boolean;
  icon?: ReactNode;
  role?: "status" | "alert";
  children: ReactNode;
}

const GRADIENT_CLIP_PATH =
  "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)";

function GradientBlob({ className }: { className: string }) {
  return (
    <div
      className={cn(
        "absolute top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl",
        className
      )}
      aria-hidden="true"
    >
      <div
        className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-[#ff80b5] to-[#9089fc] opacity-30"
        style={{ clipPath: GRADIENT_CLIP_PATH }}
      />
    </div>
  );
}

/**
 * A full-width notice at the top of the layout.
 */
export default function Banner({
  variant = "info",
  dismissible = false,
  icon,
  role,
  children,
}: BannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  return (
    <div
      role={role}
      className={cn(
        "relative isolate flex items-center gap-x-6 overflow-hidden px-6 py-2.5 sm:px-3.5 sm:before:flex-1",
        {
          "bg-primary-50 dark:bg-primary-900/30": variant === "info",
          "bg-amber-100 dark:bg-amber-900/40": variant === "warning",
        }
      )}
    >
      {variant === "info" && (
        <>
          <GradientBlob className="left-[max(-7rem,calc(50%-52rem))]" />
          <GradientBlob className="left-[max(45rem,calc(50%+8rem))]" />
        </>
      )}
      <div
        className={cn("flex items-center gap-x-2 text-sm leading-6", {
          "text-content-light dark:text-content-dark": variant === "info",
          "text-amber-900 dark:text-amber-100": variant === "warning",
        })}
      >
        {icon}
        {/* Only the content wraps. The icon stays next to the first line. */}
        <div className="flex flex-wrap items-center justify-center gap-x-2">
          {children}
        </div>
      </div>
      <div className="flex flex-1 justify-end">
        {dismissible && (
          <button
            type="button"
            className="-m-3 p-3 focus-visible:outline-offset-[-4px]"
            onClick={() => setVisible(false)}
          >
            <span className="sr-only">Dismiss</span>
            <XMarkIcon
              className="h-5 w-5 text-contentSecondary-light dark:text-contentSecondary-dark"
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </div>
  );
}
