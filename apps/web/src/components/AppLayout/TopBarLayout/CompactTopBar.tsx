import { BlobscanLogo } from "../../BlobscanLogo";
import { SearchInput } from "../../SearchInput";
import { ThemeModeButton } from "../../ThemeModeButton";
import { TopBarSurface } from "./TopBarSurface";

export const CompactTopBar = function () {
  return (
    <>
      <div className="z-10 sm:hidden">
        <TopBarSurface>
          <div className="flex w-full items-center justify-between">
            <BlobscanLogo className="w-40" />
            <ThemeModeButton />
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
