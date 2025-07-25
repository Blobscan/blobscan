import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Bars3Icon } from "@heroicons/react/24/solid";
import cn from "classnames";

import { useEnv } from "~/providers/Env";
import type { ExpandibleNavigationItem, NavigationItem } from "../content";
import { isExpandibleNavigationItem, getNavigationItems } from "../content";
import { BlobscanLogo } from "./BlobscanLogo";
import { Collapsable } from "./Collapsable";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import { Rotable } from "./Rotable";
import { SidePanel, useSidePanel } from "./SidePanel";
import { ThemeModeButton } from "./ThemeModeButton";

export function SidebarNavigationMenu({ className }: { className?: string }) {
  const { env } = useEnv();
  const [open, setOpen] = useState(false);
  const navigationItems = useMemo(
    () =>
      getNavigationItems({
        networkName: env?.PUBLIC_NETWORK_NAME,
        publicSupportedNetworks: env?.PUBLIC_SUPPORTED_NETWORKS,
      }),
    [env]
  );

  const openSidebar = useCallback(() => setOpen(true), []);

  const closeSidebar = useCallback(() => setOpen(false), []);

  return (
    <div className={className}>
      <IconButton onClick={openSidebar}>
        <Bars3Icon />
      </IconButton>
      <SidePanel open={open} onClose={closeSidebar}>
        <div className="p-4 pb-16">
          <BlobscanLogo className="mb-8 mt-4 w-40" />
          <div className="flex flex-col justify-center gap-2 opacity-80">
            {navigationItems.map((item, i) =>
              isExpandibleNavigationItem(item) ? (
                <ExpandableNavigationLinks
                  key={`${item.label}-${i}`}
                  {...item}
                  onClick={closeSidebar}
                />
              ) : (
                <NavigationLink
                  key={`${item.label}-${i}`}
                  {...item}
                  onClick={closeSidebar}
                />
              )
            )}
          </div>
        </div>

        <div className="absolute bottom-4 left-4">
          <ThemeModeButton />
        </div>
      </SidePanel>
    </div>
  );
}

type NavigationLinkProps = NavigationItem & { onClick?: () => void };

function NavigationLink({
  label,
  href,
  icon,
  onClick = () => {
    // Do nothing
  },
}: NavigationLinkProps) {
  const pathname = usePathname();
  const isSelected = href === pathname;

  return (
    <Link
      className={cn(
        "flex cursor-pointer items-center gap-1 p-2 duration-200 hover:text-iconHighlight-light hover:dark:text-iconHighlight-dark",
        {
          "border bg-iconHighlight-dark bg-opacity-10 text-iconHighlight-light dark:text-iconHighlight-dark":
            isSelected,
        }
      )}
      href={href}
      onClick={onClick}
    >
      <Icon src={icon} />
      {label}
    </Link>
  );
}

type ExpandableNavigationLinksProps = ExpandibleNavigationItem & {
  onClick?: () => void;
};

function ExpandableNavigationLinks({
  label,
  icon,
  items,
  onClick = () => {
    // Do nothing
  },
}: ExpandableNavigationLinksProps) {
  const { status } = useSidePanel();
  const pathname = usePathname();
  const [open, setOpen] = useState(items.some((x) => x.href === pathname));

  useEffect(() => {
    if (status === "closed") {
      setOpen(items.some((x) => x.href === pathname));
    }
  }, [items, pathname, status]);

  return (
    <div>
      <button
        onClick={() => setOpen((value) => !value)}
        className={`flex w-full items-center gap-3 rounded border-iconHighlight-dark border-opacity-20 bg-opacity-20 p-2 duration-300 ${
          open
            ? "border bg-iconHighlight-dark bg-opacity-10 text-iconHighlight-light dark:text-iconHighlight-dark"
            : ""
        }`}
      >
        <Rotable angle={90} rotated={open}>
          <Icon src={ChevronDownIcon} className="-rotate-90" />
        </Rotable>
        <div className="flex items-center gap-1">
          <Icon src={icon} />
          {label}
        </div>
      </button>
      <Collapsable opened={open}>
        <div className="flex flex-col gap-2 pb-4 pl-10 pt-2">
          {items.map(({ icon, href, label }) => (
            <div key={href} className="flex items-center gap-2">
              {icon && <Icon src={icon} />}
              <Link
                href={href}
                className={`text-sm ${
                  href === pathname
                    ? "text-iconHighlight-light dark:text-iconHighlight-dark"
                    : "hover:text-iconHighlight-light hover:dark:text-iconHighlight-dark"
                }`}
                onClick={onClick}
              >
                {label}
              </Link>
            </div>
          ))}
        </div>
      </Collapsable>
    </div>
  );
}
