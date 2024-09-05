import React from "react";

import { SidebarNavigationMenu } from "~/components/SidebarNavigationMenu";
import { ThemeModeButton } from "~/components/ThemeModeButton";
import { useIsHomepage } from "~/hooks/useIsHomePage";
import { ExplorerDetails } from "../../ExplorerDetails";
import { NavigationMenus } from "../../NavigationMenus";
import { CompactTopBar } from "./CompactTopBar";
import { TopBar } from "./TopBar";

export const TopBarLayout: React.FC = () => {
  const isHomepage = useIsHomepage();

  if (isHomepage) {
    return (
      <nav className="z-10 flex h-16 w-full items-center justify-end px-4 md:justify-between">
        <div className="hidden w-full md:flex">
          <ExplorerDetails placement="top" />
        </div>
        <div className="flex items-center gap-3">
          <div className=" xl:hidden">
            <SidebarNavigationMenu />
          </div>
          <div className="hidden xl:flex">
            <NavigationMenus />
          </div>
          <div className="relative ml-2 hidden xl:block">
            <ThemeModeButton />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <div
        className={`z-10 hidden h-16 w-full items-center justify-between sm:block`}
      >
        <TopBar />
      </div>
      <CompactTopBar />
    </>
  );
};
