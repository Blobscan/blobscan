import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Bars3Icon } from "@heroicons/react/24/solid";
import cn from "classnames";

import { BlobscanLogo } from "./BlobscanLogo";
import { Button } from "./Button";
import { Collapsable } from "./Collapsable";
import { Rotable } from "./Rotable";
import { SidePanel, useSidePanel } from "./SidePanel";
import { ThemeModeButton } from "./ThemeModeButton";
import type { ExpandibleNavigationItem, NavigationItem } from "./content";
import { isExpandibleNavigationItem, NAVIGATION_ITEMS } from "./content";

export function SidebarNavigationMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <Button
        variant="icon"
        onClick={() => setOpen(true)}
        icon={<Bars3Icon />}
      />
      <SidePanel open={open} onClose={() => setOpen(false)}>
        <div className="p-4 pb-16">
          <BlobscanLogo className="mb-8 mt-4 w-40" />
          <div className="flex flex-col justify-center gap-2 opacity-80">
            {NAVIGATION_ITEMS.map((item, i) =>
              isExpandibleNavigationItem(item) ? (
                <ExpandableNavigationLinks
                  key={`${item.label}-${i}`}
                  {...item}
                />
              ) : (
                <NavigationLink key={`${item.label}-${i}`} {...item} />
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

function NavigationLink({ label, href, icon }: NavigationItem) {
  const pathname = usePathname();
  const isSelected = href === pathname;

  return (
    <a
      className={cn(
        "flex cursor-pointer items-center gap-1 p-2 duration-200 hover:text-iconHighlight-light hover:dark:text-iconHighlight-dark",
        {
          "border bg-iconHighlight-dark bg-opacity-10 text-iconHighlight-light dark:text-iconHighlight-dark":
            isSelected,
        }
      )}
      href={href}
    >
      <div className="h-5 w-5">{icon}</div>
      {label}
    </a>
  );
}

function ExpandableNavigationLinks({
  label,
  icon,
  items,
}: ExpandibleNavigationItem) {
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
          <ChevronDownIcon className="mb-2 h-5 w-5 -rotate-90" />
        </Rotable>
        <div className="flex items-center gap-1">
          <div className="h-5 w-5">{icon}</div>
          {label}
        </div>
      </button>
      <Collapsable opened={open}>
        <div className="flex flex-col gap-2 pb-4 pl-10 pt-2">
          {items.map(({ href, label }, index) => (
            <a
              key={index}
              href={href}
              className={`text-sm duration-200 ${
                href === pathname
                  ? "text-iconHighlight-light dark:text-iconHighlight-dark"
                  : "hover:text-iconHighlight-light hover:dark:text-iconHighlight-dark"
              }`}
            >
              {label}
            </a>
          ))}
        </div>
      </Collapsable>
    </div>
  );
}
