import { Logo } from "../../BlobscanLogo";
import { DarkModeButton } from "../../DarkModeButton";
import { SearchInput } from "../../SearchInput";
import { TopBarSurface } from "./TopBarSurface";

export const MobileNav = function () {
  return (
    <>
      <div className="z-10 sm:hidden">
        <TopBarSurface>
          <div className="flex w-full justify-between">
            <Logo size="sm" />
            <DarkModeButton />
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
      </div>
    </>
  );
};
