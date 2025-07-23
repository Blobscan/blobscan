import { SidebarNavigationMenu } from "~/components/SidebarNavigationMenu";
import { BlobscanLogo } from "../../BlobscanLogo";
import { NetworkIndicators } from "../../Indicators/NetworkIndicators";
import { NavigationMenus } from "../../NavigationMenus";
import { SearchInput } from "../../SearchInput";
import { ThemeModeButton } from "../../ThemeModeButton";
import { TopBarSurface } from "./TopBarSurface";

export const CompactedTopBar = function () {
  return (
    <>
      <div className="z-50 sm:hidden">
        <TopBarSurface>
          <div className="flex w-full items-center justify-between">
            <BlobscanLogo className="w-40" />
            <SidebarNavigationMenu className="xl:hidden" />
          </div>
        </TopBarSurface>
      </div>
      <div className="sticky top-0 z-10 sm:hidden">
        <TopBarSurface>
          <div className="flex items-center justify-between space-x-3">
            <div className="w-full">
              <SearchInput />
            </div>
          </div>
        </TopBarSurface>
        <TopBarSurface>
          <NetworkIndicators />
        </TopBarSurface>
      </div>
    </>
  );
};

export const TopBar: React.FC = () => {
  return (
    <div>
      <TopBarSurface>
        <div className="flex h-full items-center justify-between">
          <div className="flex grow items-center gap-12">
            <BlobscanLogo className="w-40" />
          </div>
          <div className="flex w-full items-center justify-end gap-5">
            <div className="hidden xl:block">
              <NavigationMenus />
            </div>
            <div className="w-5/12 sm:max-w-xl">
              <SearchInput />
            </div>
            <div className="hidden xl:block">
              <ThemeModeButton />
            </div>
            <div className="block xl:hidden">
              <SidebarNavigationMenu />
            </div>
          </div>
        </div>
      </TopBarSurface>
      <TopBarSurface>
        <div className="-my-1 flex items-center gap-2">
          <NetworkIndicators />
        </div>
      </TopBarSurface>
    </div>
  );
};
