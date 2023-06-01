import React from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import { useTheme } from "next-themes";

import { useIsMounted } from "~/hooks/useIsMounted";

export function DarkModeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const isMounted = useIsMounted();

  if (!isMounted) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={`
        rounded-full p-2
        text-icon-light 
        shadow-sm transition-colors
        hover:bg-primary-200
        focus-visible:outline
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-iconHighlight-dark
        dark:text-icon-dark
        hover:dark:bg-primary-800
      `}
    >
      {resolvedTheme === "dark" ? (
        <SunIcon className="h-5 w-5" aria-hidden="true" />
      ) : (
        <MoonIcon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
