import { api } from "~/api-client";
import { env } from "~/env.mjs";
import { Logo } from "../../BlobscanLogo";
import { SearchInput } from "../../SearchInput";
import { ThemeModeButton } from "../../ThemeModeButton";
import { NavMenusSection } from "./NavMenusSection";
import { TopBarSurface } from "./TopBarSurface";

export const DesktopNav: React.FC = () => {
  const { data: syncStateData, error } = api.syncState.getSyncState.useQuery();

  return (
    <div>
      <TopBarSurface>
        <div className="mx-1 flex h-4 gap-4 align-middle text-xs text-contentSecondary-light dark:text-contentSecondary-dark">
          {env.NEXT_PUBLIC_CHAIN_NAME && (
            <div>
              <span>Network: </span>
              <span className="font-semibold">
                {env.NEXT_PUBLIC_CHAIN_NAME}
              </span>
            </div>
          )}
          ･
          <div>
            <span>Last Synced Slot: </span>
            {syncStateData && (
              <span className="font-semibold">{syncStateData.lastSlot}</span>
            )}
          </div>
        </div>
      </TopBarSurface>
      <TopBarSurface>
        <div className="flex h-full justify-between">
          <div className="flex grow  items-end gap-12">
            <Logo className="h-8 w-32 sm:h-9 sm:w-36" />
          </div>
          <div className="flex grow-[3] justify-end gap-5">
            <div className="self-end">
              <NavMenusSection />
            </div>
            <div className="w-full sm:max-w-xl">
              <SearchInput />
            </div>
            <ThemeModeButton />
          </div>
        </div>
      </TopBarSurface>
    </div>
  );
};
