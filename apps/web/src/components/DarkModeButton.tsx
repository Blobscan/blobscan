import React from "react";
import { SunIcon } from "@heroicons/react/24/outline";

// import { MoonIcon } from "@heroicons/react/24/solid";

export function DarkModeButton() {
  return (
    <button
      type="button"
      className="rounded-full p-2  text-icon-light shadow-sm transition-colors hover:bg-primary-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iconHighlight-dark dark:text-icon-dark hover:dark:bg-primary-800"
    >
      <SunIcon className="h-5 w-5" aria-hidden="true" />
      {/* <MoonIcon className="h-5 w-5" aria-hidden="true" /> */}
    </button>
  );
}
