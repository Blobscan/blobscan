import React from "react";
import { useRouter } from "next/router";

import { DarkModeButton } from "~/components/DarkModeButton";
import { DesktopNav } from "./DesktopTopBar";
import { MobileNav } from "./MobileTopBar";

export const TopBarLayout: React.FC = () => {
  const { pathname } = useRouter();
  const isHomePage = pathname === "/";

  if (isHomePage) {
    return (
      <nav className="z-10 flex h-16 w-full items-center justify-end px-4">
        <DarkModeButton />
      </nav>
    );
  }

  return (
    <>
      <div
        className={`z-10 hidden h-16 w-full items-center justify-between sm:block`}
      >
        <DesktopNav />
      </div>
      <MobileNav />
    </>
  );
};
