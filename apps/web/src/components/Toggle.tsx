import type { FC } from "react";
import { useState } from "react";
import { Switch } from "@headlessui/react";
import cn from "classnames";

import type { Size } from "~/types";

export type ToggleProps = {
  size?: Size;
  onToggle(enabled: boolean): void;
};

export const Toggle: FC<ToggleProps> = function ({ size = "md", onToggle }) {
  const [isEnabled, setIsEnabled] = useState(false);
  return (
    <Switch
      checked={isEnabled}
      onChange={() => {
        setIsEnabled(!isEnabled);
        onToggle(!isEnabled);
      }}
      className={cn(
        {
          "bg-primary-400 dark:bg-primary-400": isEnabled,
          "bg-neutral-400 dark:bg-neutral-500": !isEnabled,
        },
        {
          "h-3 w-7": size === "sm",
          "h-4 w-8": size === "md",
          "h-5 w-10": size === "lg",
        },
        "relative inline-flex w-11 flex-shrink-0 cursor-pointer",
        "rounded-full border-2 border-transparent transition-colors duration-200",
        "ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
      )}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={cn(
          {
            "translate-x-3.5": isEnabled && size !== "lg",
            "translate-x-6": isEnabled && size === "lg",
            "-translate-x-0.5": !isEnabled,
          },
          {
            "h-3 w-3": size === "sm",
            "h-4 w-4": size === "md",
            "h-5 w-5": size === "lg",
          },
          "relative bottom-0.5",
          "pointer-events-none inline-block transform rounded-full",
          "bg-shades-00 ring-0 transition duration-200 ease-in-out"
        )}
      />
    </Switch>
  );
};
