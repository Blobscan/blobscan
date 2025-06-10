import React from "react";

import { SidebarNavigationMenu } from "~/components/SidebarNavigationMenu";
import { ThemeModeButton } from "~/components/ThemeModeButton";
import { useIsHomepage } from "~/hooks/useIsHomePage";
import { TopAppStatus } from "../../AppStatus";
import { NavigationMenus } from "../../NavigationMenus";
import { CompactTopBar } from "./CompactTopBar";
import { TopBar } from "./TopBar";

export const TopBarLayout: React.FC = () => {
  const isHomepage = useIsHomepage();

  if (isHomepage) {
    return (
      <>
        <nav className="z-10 flex h-16 w-full items-center  justify-between px-4">
          <div className="w-11/12 sm:w-full md:ml-0 md:flex">
            <TopAppStatus />
          </div>
          <div className="flex items-center gap-3">
            <div className="xl:hidden">
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
      </>
    );
  }

  return (
    <>
      <div
        className={`hidden h-16 w-full items-center justify-between sm:block`}
      >
        <TopBar />
      </div>
      <CompactTopBar />
    </>
  );
};
