import React from "react";

import { ThemeModeButton } from "~/components/ThemeModeButton";
import { useIsHomepage } from "~/hooks/useIsHomePage";
import { DesktopNav } from "./DesktopTopBar";
import { MobileNav } from "./MobileTopBar";
import { NavMenusSection } from "./NavMenusSection";

export const TopBarLayout: React.FC = () => {
  const isHomepage = useIsHomepage();

  if (isHomepage) {
    return (
      <nav className="z-10 flex h-16 w-full items-center justify-between px-4">
        <NavMenusSection />
        <ThemeModeButton />
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
