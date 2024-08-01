import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Bars3Icon } from "@heroicons/react/24/solid";

import { BlobscanLogo } from "../BlobscanLogo";
import { Button } from "../Button";
import { Collapsable } from "../Collapsable";
import { Rotable } from "../Rotable";
import { ThemeModeButton } from "../ThemeModeButton";
import type { ExpandibleMenuItem, MenuItem } from "./data";
import { MENU_DATA } from "./data";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [open]);

  return (
    <>
      <Button
        variant="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        icon={<Bars3Icon />}
      />
      <MobileMenuBackground open={open} close={() => setOpen(false)} />
      <div
        className={`fixed left-0 top-0 z-50 h-full w-[80%] overflow-y-auto border-r border-black border-opacity-20 bg-background-light p-4 duration-300 dark:bg-background-dark ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <BlobscanLogo className="mb-8 mt-4 w-40" />
        <div className="flex flex-col justify-center gap-2 opacity-80">
          {MENU_DATA.map((item, i) =>
            item.type === "expandible" ? (
              <ExpandibleItem {...item} key={`mobile-${i}`} />
            ) : (
              <SingleItem {...item} key={`mobile-${i}`} />
            )
          )}
        </div>
        <div className="absolute bottom-4 left-4">
          <ThemeModeButton />
        </div>
      </div>
    </>
  );
}

function MobileMenuBackground({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) {
  useEffect(() => {
    const keydownHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", keydownHandler);

    return () => {
      document.removeEventListener("keydown", keydownHandler);
    };
  }, [close]);

  return (
    <div
      className={`fixed left-0 top-0 z-10 h-full w-full bg-black ${
        open ? "opacity-80" : "pointer-events-none opacity-0"
      }`}
      onClick={close}
      tabIndex={0}
      role="button"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          close();
        }
      }}
    />
  );
}

function SingleItem({ label, href, icon }: MenuItem) {
  return (
    <a
      className="flex cursor-pointer items-center gap-1 p-2 duration-200 hover:text-iconHighlight-light hover:dark:text-iconHighlight-dark"
      href={href}
    >
      <div className="h-5 w-5">{icon}</div>
      {label}
    </a>
  );
}

function ExpandibleItem({ label, icon, items }: ExpandibleMenuItem) {
  const pathname = usePathname();
  const [open, setOpen] = useState(items.some((x) => x.href === pathname));

  return (
    <div>
      <button
        onClick={() => setOpen((value) => !value)}
        className={`flex w-full items-center gap-3 rounded bg-opacity-20 p-2 ${
          open
            ? "border border-iconHighlight-dark border-opacity-20 bg-iconHighlight-dark bg-opacity-10 text-iconHighlight-light dark:text-iconHighlight-dark"
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
          {items.map((subItem, index) => (
            <ExpandibleSubItem {...subItem} key={`${label}-${index}-mobile`} />
          ))}
        </div>
      </Collapsable>
    </div>
  );
}

function ExpandibleSubItem({ label, href }: { label: string; href: string }) {
  const pathname = usePathname();

  return (
    <a
      href={href}
      className={`text-sm duration-200 ${
        href === pathname
          ? "text-iconHighlight-light dark:text-iconHighlight-dark"
          : "hover:text-iconHighlight-light hover:dark:text-iconHighlight-dark"
      }`}
    >
      {label}
    </a>
  );
}
