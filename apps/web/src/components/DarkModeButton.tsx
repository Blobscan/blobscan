import React from "react";
import { SunIcon } from "@heroicons/react/24/outline";

// import { MoonIcon } from "@heroicons/react/24/solid";

export function DarkModeButton() {
  return (
    <button
      type="button"
      className="dark:text-icon-dark text-icon-light  focus-visible:outline-iconHighlight-dark rounded-full p-2 shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <SunIcon className="h-5 w-5" aria-hidden="true" />
      {/* <MoonIcon className="h-5 w-5" aria-hidden="true" /> */}
    </button>
  );
}
