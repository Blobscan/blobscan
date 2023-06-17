import { ChartBarIcon, Squares2X2Icon } from "@heroicons/react/24/solid";

import { Logo } from "../../BlobscanLogo";
import { SearchInput } from "../../SearchInput";
import { ThemeModeButton } from "../../ThemeModeButton";
import { MenuNavItem } from "./MenuNavItem";
import { TopBarSurface } from "./TopBarSurface";

export const DesktopNav: React.FC = () => {
  return (
    <TopBarSurface>
      <div className="flex h-full justify-between">
        <div className="flex grow  items-end gap-12">
          <Logo className="h-8 w-32 sm:h-9 sm:w-36" />
        </div>
        <div className="flex grow-[3] justify-end gap-5">
          <div className="flex gap-4 self-end">
            <MenuNavItem
              label="Blockchain"
              icon={<Squares2X2Icon />}
              items={[
                { label: "Blocks", href: "/blocks" },
                { label: "Transactions", href: "/txs" },
              ]}
            />
            <MenuNavItem
              label="Stats"
              icon={<ChartBarIcon />}
              items={[
                {
                  label: "Blob Metrics",
                  href: "/stats/blob",
                },
                { label: "Block Metrics", href: "/stats/block" },
                { label: "Transaction Metrics", href: "/stats/transaction" },
              ]}
            />
          </div>
          <div className="w-full sm:max-w-xl">
            <SearchInput />
          </div>
          <ThemeModeButton />
        </div>
      </div>
    </TopBarSurface>
  );
};
