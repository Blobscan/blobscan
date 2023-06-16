import { Fragment, useRef, type FC, type ReactNode } from "react";
import Link from "next/link";
import { Popover, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

import { useHover } from "~/hooks/useHover";

type MenuNavItemProps = {
  label: string;
  icon?: ReactNode;
  items: { label: string; href: string; icon?: ReactNode }[];
};

type NavItemProps = {
  href: string;
  label: string;
  icon?: ReactNode;
  isLast?: boolean;
};

const MenuItem: FC<NavItemProps> = function ({
  href,
  label,
  icon,
  isLast = false,
}) {
  return (
    <Popover.Button as={Link} href={href}>
      <div
        className={`px-4 py-2 transition-all ${
          isLast && "rounded-b-lg"
        } hover:bg-primary-300 hover:text-content-light/60 hover:dark:bg-iconHighlight-dark/80 hover:dark:text-content-dark`}
      >
        {icon}
        <div className="text-xs">{label}</div>
      </div>
    </Popover.Button>
  );
};

export const MenuNavItem: FC<MenuNavItemProps> = function ({
  label,
  items,
  icon,
}) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const isHovered = useHover(popoverRef);

  return (
    <Popover ref={popoverRef} className="relative">
      {() => {
        return (
          <>
            <Popover.Button>
              <div
                className={`flex items-center gap-1 ${
                  isHovered
                    ? "text-iconHighlight-light dark:text-iconHighlight-dark"
                    : "text-content-light dark:text-content-dark"
                }  text-sm transition-colors`}
              >
                <div className="h-4 w-4">{icon}</div>
                {label}
                <ChevronDownIcon
                  className={`h-3 w-3 font-bold group-hover:text-opacity-80`}
                  aria-hidden="true"
                />
              </div>
              {/*
                    Empty div that allows us to move the cursor down to the menu without
                    without losing the hover state on the button
                */}
              <div className="absolute h-4 w-full" />
            </Popover.Button>

            <Transition
              show={isHovered}
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute top-8 z-10 w-44" static>
                <div className="rounded-b-lg border-t-4 border-t-primary-400 bg-surface-light text-contentSecondary-light shadow-xl  shadow-primary-400/30 dark:border-t-primary-400 dark:bg-surface-dark dark:text-contentSecondary-dark  dark:shadow-lg dark:shadow-primary-800/20">
                  <div className="flex flex-col flex-nowrap gap-1">
                    {items.map((item, index) => (
                      <MenuItem
                        key={index}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        isLast={index === items.length - 1}
                      />
                    ))}
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        );
      }}
    </Popover>
  );
};
